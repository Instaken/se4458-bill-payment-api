const db = require('../config/db');

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
