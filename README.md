# Mobile Provider Bill Payment API - Group 1
**SE 4458 Software Architecture & Design of Modern Large Scale Systems - Midterm Project**

This project is a cloud-native RESTful API designed for a fictitious Mobile Provider system. It allows subscribers to query bills, make payments, and enables admins to manage billing records via single or batch operations.

## 🔗 Project Links:

- **Live Swagger Documentation:** https://se4458-api-405686366356.europe-west3.run.app/api-docs
---

## 🏗️ System Design & Architecture

The system is built on a **Serverless Architecture** using Google Cloud Platform (GCP) to ensure scalability and cost-efficiency, suitable for "Large Scale Systems".

### Tech Stack
* **Runtime:** Node.js (Express.js)
* **Database:** Google Cloud Firestore (NoSQL - Native Mode)
* **Hosting:** Google Cloud Run (Serverless Container)
* **API Gateway:** Google Cloud API Gateway (Traffic Management & Security)
* **Documentation:** Swagger / OpenAPI 2.0

### Key Design Decisions
1.  **API Gateway Pattern:** Instead of exposing the backend directly, an API Gateway is used as a single entry point. This handles **Authentication (API Key)** and **Rate Limiting (Quotas)** centrally, offloading these concerns from the application logic.
2.  **NoSQL Database:** Firestore was chosen over relational databases to handle high-throughput read/write operations and flexible schema requirements typical in billing systems.
3.  **Stateless Backend:** The application is containerized and stateless, allowing Cloud Run to scale down to zero when idle and scale up automatically during high traffic.

---

## 📊 Data Model (ER Diagram)

Since Firestore is a NoSQL document database, the data is structured in **Collections** and **Documents**. We utilized a hierarchical structure to optimize for the "Query by Subscriber" pattern.

```mermaid
erDiagram
    SUBSCRIBER ||--o{ BILL : has
    
    SUBSCRIBER {
        string subscriberNo PK "Document ID"
        int dailyQueryCount "For Rate Limiting"
        string lastQueryDate "YYYY-MM-DD"
    }

    BILL {
        string month PK "Document ID (e.g. 2024-11)"
        float amount "Total Bill Amount"
        float paidAmount "Amount Paid So Far"
        string status "PAID or UNPAID"
        object details "JSON: Data usage, calls etc."
    }