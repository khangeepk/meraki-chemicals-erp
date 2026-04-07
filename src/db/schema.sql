-- DDL for Purchasing Table
CREATE TABLE IF NOT EXISTS tbl_Purchasing (
    Prod_ID SERIAL PRIMARY KEY,
    Purch_Date DATE NOT NULL DEFAULT CURRENT_DATE,
    Prod_Name VARCHAR(255) NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Prod_Cost DECIMAL(12, 2) NOT NULL,
    Disc_Availed DECIMAL(12, 2) DEFAULT 0.00,
    Purch_Amount DECIMAL(12, 2) NOT NULL,
    Carriage_Offload_Cost DECIMAL(12, 2) DEFAULT 0.00,
    Final_Cost DECIMAL(12, 2) NOT NULL,
    Per_item_Rate DECIMAL(12, 2) NOT NULL,
    Purch_From VARCHAR(255),
    Contact_No VARCHAR(50),
    Email VARCHAR(150),
    Remarks TEXT,
    Purch_Receipt_Proof VARCHAR(500)
);

-- DDL for Sales Table
CREATE TABLE IF NOT EXISTS tbl_Sales (
    Sale_ID SERIAL PRIMARY KEY,
    Prod_ID INT NOT NULL,
    Sale_Date DATE NOT NULL DEFAULT CURRENT_DATE,
    Prod_Name VARCHAR(255) NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Prod_Cost DECIMAL(12, 2) NOT NULL,
    Disc_Availed DECIMAL(12, 2) DEFAULT 0.00,
    Sold_Amount DECIMAL(12, 2) NOT NULL,
    Sold_To VARCHAR(255),
    Contact_No VARCHAR(50),
    Email VARCHAR(150),
    Gross_Amount DECIMAL(12, 2) NOT NULL,
    Net_Profit DECIMAL(12, 2) NOT NULL,
    Deduction_Charity DECIMAL(12, 2) NOT NULL,
    Final_Profit_Sami DECIMAL(12, 2) NOT NULL,
    Final_Profit_Saif DECIMAL(12, 2) NOT NULL,
    Remaining_Inventory INT NOT NULL,
    Remarks TEXT,
    Sale_Receipt_Proof VARCHAR(500),
    CONSTRAINT fk_purchased_product
        FOREIGN KEY (Prod_ID)
        REFERENCES tbl_Purchasing (Prod_ID)
        ON DELETE RESTRICT
);

-- User Credentials and Configs
CREATE TABLE IF NOT EXISTS tbl_Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'User' CHECK (role IN ('Admin', 'User')),
    permissions JSONB DEFAULT '{"add": false, "edit": false, "delete": false}'
);

-- Main Software Profile Configurations
CREATE TABLE IF NOT EXISTS tbl_Company_Profile (
    id SERIAL PRIMARY KEY,
    Company_Name VARCHAR(255) NOT NULL,
    Logo_Path VARCHAR(500),
    Contact VARCHAR(50),
    Address TEXT
);

-- DDL for Partner Investment Ledger
CREATE TABLE IF NOT EXISTS tbl_Investment_Ledger (
    Ledger_ID SERIAL PRIMARY KEY,
    Investment_Date DATE NOT NULL,
    Item_Details TEXT NOT NULL,
    Principal_Amount DECIMAL(12, 2) NOT NULL,
    PO_Slip_URL VARCHAR(500) NOT NULL,
    Sent_Payment_Receipt_URL VARCHAR(500) NOT NULL,
    Return_Date DATE,
    Sale_Amount DECIMAL(12, 2),
    Expense_Amount DECIMAL(12, 2),
    Return_Receipt_URL VARCHAR(500),
    Net_Profit DECIMAL(12, 2),
    Sami_Qaiser_Profit DECIMAL(12, 2),
    Saif_Profit DECIMAL(12, 2),
    Charity_Deduction DECIMAL(12, 2)
);
