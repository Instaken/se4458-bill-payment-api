const db = require('../config/db');
const fs = require('fs');
const csv = require('csv-parser');

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
                    if (row.SubscriberNo && row.Month && row.Amount) {
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
