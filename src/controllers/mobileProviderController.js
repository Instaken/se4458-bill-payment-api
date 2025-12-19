const db = require('../config/db');

const getTodayDate = () => new Date().toISOString().split('T')[0];

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
