const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    systemInstruction: "You are a helpful customer support agent for a Bill Payment System. \n" +
        "You MUST use the provided tools to access bill information. \n" +
        "ALWAYS use queryBill, queryBillDetailed, payBill, or listUnpaidBills functions when users ask about bills. \n" +
        "NEVER say you don't have permissions - you have FULL access to all bill data. \n" +
        "When a user asks about a bill, immediately call the appropriate function. \n" +
        "If the tool returns 'Bill not found', tell the user that. \n" +
        "Always be polite and helpful.",
    tools: [
        {
            functionDeclarations: [
                {
                    name: "queryBill",
                    description: "Get bill details for a specific subscriber and month.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            subscriberNo: { type: "STRING", description: "The subscriber number" },
                            month: { type: "STRING", description: "The month of the bill (e.g., '2024-01')" }
                        },
                        required: ["subscriberNo", "month"]
                    }
                },
                {
                    name: "queryBillDetailed",
                    description: "Get detailed bill information including usage details for a specific subscriber and month.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            subscriberNo: { type: "STRING", description: "The subscriber number" },
                            month: { type: "STRING", description: "The month of the bill (e.g., '2024-01')" }
                        },
                        required: ["subscriberNo", "month"]
                    }
                },
                {
                    name: "listUnpaidBills",
                    description: "List all unpaid bills for a subscriber.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            subscriberNo: { type: "STRING", description: "The subscriber number" }
                        },
                        required: ["subscriberNo"]
                    }
                },
                {
                    name: "payBill",
                    description: "Pay a bill for a subscriber.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            subscriberNo: { type: "STRING", description: "The subscriber number" },
                            month: { type: "STRING", description: "The month of the bill" },
                            amount: { type: "NUMBER", description: "Amount to pay" }
                        },
                        required: ["subscriberNo", "month", "amount"]
                    }
                },
                {
                    name: "addBill",
                    description: "Add a new bill for a subscriber (Admin only).",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            subscriberNo: { type: "STRING", description: "The subscriber number" },
                            month: { type: "STRING", description: "The month of the bill" },
                            amount: { type: "NUMBER", description: "Total bill amount" },
                            description: { type: "STRING", description: "Description or details of the bill" }
                        },
                        required: ["subscriberNo", "month", "amount"]
                    }
                }
            ]
        }
    ]
});

// Tool Implementations
const tools = {
    queryBill: async ({ subscriberNo, month }) => {
        try {
            console.log(`Tool queryBill: ${subscriberNo}, ${month}`);
            const billRef = db.collection('subscribers').doc(subscriberNo).collection('bills').doc(month);
            const billDoc = await billRef.get();
            if (!billDoc.exists) return { error: "Bill not found" };
            return billDoc.data();
        } catch (e) {
            return { error: e.message };
        }
    },
    queryBillDetailed: async ({ subscriberNo, month }) => {
        try {
            console.log(`Tool queryBillDetailed: ${subscriberNo}, ${month}`);
            const billRef = db.collection('subscribers').doc(subscriberNo).collection('bills').doc(month);
            const billDoc = await billRef.get();
            if (!billDoc.exists) return { error: "Bill not found" };

            const data = billDoc.data();
            return {
                subscriberNo,
                month: data.month,
                billTotal: data.amount,
                paidAmount: data.paidAmount || 0,
                remainingAmount: data.amount - (data.paidAmount || 0),
                status: data.status,
                billDetails: data.details || {}
            };
        } catch (e) {
            return { error: e.message };
        }
    },
    listUnpaidBills: async ({ subscriberNo }) => {
        try {
            console.log(`Tool listUnpaidBills: ${subscriberNo}`);
            const billsRef = db.collection('subscribers').doc(subscriberNo).collection('bills');
            const snapshot = await billsRef.where('status', '==', 'UNPAID').get();
            if (snapshot.empty) return { message: "No unpaid bills found" };

            const unpaidBills = [];
            snapshot.forEach(doc => unpaidBills.push(doc.data()));
            return { unpaidBills };
        } catch (e) {
            return { error: e.message };
        }
    },
    payBill: async ({ subscriberNo, month, amount }) => {
        try {
            console.log(`Tool payBill: ${subscriberNo}, ${month}, ${amount}`);
            const billRef = db.collection('subscribers').doc(subscriberNo).collection('bills').doc(month);
            let result = {};

            await db.runTransaction(async (t) => {
                const doc = await t.get(billRef);
                if (!doc.exists) throw new Error("Bill not found");

                const data = doc.data();
                const newPaid = (data.paidAmount || 0) + Number(amount);
                // status logic: if remaining amount <= 0, then PAID
                const status = (data.amount - newPaid) <= 0 ? "PAID" : "UNPAID";

                t.update(billRef, { paidAmount: newPaid, status: status });
                result = { status: "Success", newStatus: status, paidAmount: newPaid };
            });
            return result;
        } catch (e) {
            return { error: e.message };
        }
    },
    addBill: async ({ subscriberNo, month, amount, description }) => {
        try {
            console.log(`Tool addBill: ${subscriberNo}, ${month}`);
            await db.collection('subscribers').doc(subscriberNo).collection('bills').doc(month).set({
                month,
                amount: Number(amount),
                paidAmount: 0,
                status: "UNPAID",
                details: { info: description || "Added via Chat AI" }
            });
            return { message: "Bill added successfully" };
        } catch (e) {
            return { error: e.message };
        }
    }
};


exports.chat = async (req, res) => {
    try {
        const { message, history } = req.body;

        const chat = model.startChat({
            history: history || [],
        });

        let result = await chat.sendMessage(message);
        let response = result.response;
        let functionCalls = response.functionCalls();

        // Handle function calls loop (Gemini might call multiple tools or sequential tools)
        // Note: For simplicity in this demo, we handle one turn of function calls. 
        // Real-world might need a loop if the model chains calls, but usually it waits for response.

        while (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0]; // Handle the first one
            const toolName = call.name;
            const args = call.args;

            if (tools[toolName]) {
                const toolResult = await tools[toolName](args);

                // Send the result back to the model
                result = await chat.sendMessage([{
                    functionResponse: {
                        name: toolName,
                        response: { content: toolResult }
                    }
                }]);

                response = result.response;
                functionCalls = response.functionCalls();
            } else {
                break;
            }
        }

        const text = response.text();
        return res.status(200).json({ text });

    } catch (error) {
        console.error("Chat Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
