const db = require('../config/db');
const fs = require('fs');
const csv = require('csv-parser');

const getTodayDate = () => new Date().toISOString().split('T')[0];

// 1. QUERY BILL
exports.queryBill = async (req, res) => {
    try {
        const { subscriberNo, month } = req.body;
        if (!subscriberNo || !month) return res.status(400).json({ error: 'Missing parameters' });

        // Rate Limiting Logic 
        const subRef = db.collection('subscribers').doc(subscriberNo);
        const subDoc = await subRef.get();
        const today = getTodayDate();
        
        let currentCount = 0;
        if (!subDoc.exists) {
            await subRef.set({ subscriberNo, lastQueryDate: today, dailyQueryCount: 1 });
        } else {
            const data = subDoc.data();
            if (data.lastQueryDate !== today) {
                await subRef.update({ lastQueryDate: today, dailyQueryCount: 1 });
            } else {
                if (data.dailyQueryCount >= 3) return res.status(429).json({ error: 'Daily query limit exceeded' });
                await subRef.update({ dailyQueryCount: data.dailyQueryCount + 1 });
            }
        }

        const billRef = subRef.collection('bills').doc(month);
        const billDoc = await billRef.get();

        if (!billDoc.exists) return res.status(404).json({ error: 'Bill not found' });

       
        return res.status(200).json({
            subscriberNo,
            month,
            billTotal: billDoc.data().amount,
            paidStatus: billDoc.data().status
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 2. QUERY BILL DETAILED (WITH PAGING SUPPORT)
exports.queryBillDetailed = async (req, res) => {
    try {
        const { subscriberNo, month } = req.body;
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const billRef = db.collection('subscribers').doc(subscriberNo).collection('bills').doc(month);
        const billDoc = await billRef.get();

        if (!billDoc.exists) return res.status(404).json({ error: 'Bill not found' });
        
        const data = billDoc.data();

        return res.status(200).json({
            subscriberNo,
            month,
            billTotal: data.amount,
            billDetails: data.details || {}, 
            paging: {
                page: page,
                limit: limit,
                note: "Detailed view provided"
            }
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 3. PAY BILL
exports.payBill = async (req, res) => {
    try {
        const { subscriberNo, month, paymentAmount } = req.body;
        const billRef = db.collection('subscribers').doc(subscriberNo).collection('bills').doc(month);
        
        await db.runTransaction(async (t) => {
            const doc = await t.get(billRef);
            if (!doc.exists) throw new Error("Bill not found");
            
            const data = doc.data();
            const newPaid = (data.paidAmount || 0) + Number(paymentAmount);
            const status = (data.amount - newPaid) <= 0 ? "PAID" : "UNPAID";

            t.update(billRef, { paidAmount: newPaid, status: status });
        });

        return res.status(200).json({ status: "Success", message: "Payment processed" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 4. ADMIN - ADD SINGLE BILL
exports.addBill = async (req, res) => {
    try {
        const { subscriberNo, month, amount, details } = req.body;
        
        await db.collection('subscribers').doc(subscriberNo).collection('bills').doc(month).set({
            month,
            amount: Number(amount),
            paidAmount: 0,
            status: "UNPAID",
            details: details || { info: "Standard Bill" }
        });

        return res.status(200).json({ message: "Bill added successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 5. ADMIN - BATCH UPLOAD BILLS VIA CSV
exports.uploadBatchBills = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Please upload a CSV file' });

        const results = [];
        
        // Read and process the CSV file
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                // File reading finished, write to database
                const batch = db.batch();
                
                results.forEach((row) => {
                    // CSV format: SubscriberNo, Month, Amount
                    if(row.SubscriberNo && row.Month && row.Amount) {
                        const ref = db.collection('subscribers')
                            .doc(row.SubscriberNo)
                            .collection('bills')
                            .doc(row.Month);
                            
                        batch.set(ref, {
                            month: row.Month,
                            amount: Number(row.Amount),
                            paidAmount: 0,
                            status: "UNPAID",
                            details: { source: "Batch Upload" }
                        });
                    }
                });

                await batch.commit(); 
                fs.unlinkSync(req.file.path); 
                
                return res.status(200).json({ 
                    message: `${results.length} bills processed successfully from CSV.` 
                });
            });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// 6. BANKING APP - LIST UNPAID BILLS
exports.listUnpaidBills = async (req, res) => {
    try {
        const { subscriberNo } = req.body;
        if (!subscriberNo) return res.status(400).json({ error: 'Subscriber No is required' });

        const billsRef = db.collection('subscribers').doc(subscriberNo).collection('bills');
        // Only fetch 'UNPAID' bills
        const snapshot = await billsRef.where('status', '==', 'UNPAID').get();

        if (snapshot.empty) {
            return res.status(200).json({ subscriberNo, unpaidBills: [] });
        }

        const unpaidBills = [];
        snapshot.forEach(doc => {
            unpaidBills.push(doc.data());
        });

        return res.status(200).json({
            subscriberNo,
            unpaidBills
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};