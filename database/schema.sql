-- Medical Claim Approval System - Database Schema
-- PostgreSQL Database Schema with complete relationships and audit trails

-- ============================================
-- 1. USER MANAGEMENT
-- ============================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('CUSTOMER', 'AUDITOR', 'CASHIER', 'ADMIN')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================
-- 2. CUSTOMER MASTER & INSURANCE POLICY
-- ============================================

CREATE TABLE customer_master (
    customer_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    emergency_contact VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE insurance_policy (
    policy_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customer_master(customer_id) ON DELETE CASCADE,
    policy_number VARCHAR(100) UNIQUE NOT NULL,
    policy_type VARCHAR(100) NOT NULL,
    insurance_provider VARCHAR(255) NOT NULL,
    coverage_amount DECIMAL(15, 2) NOT NULL,
    remaining_amount DECIMAL(15, 2) NOT NULL,
    policy_start_date DATE NOT NULL,
    policy_end_date DATE NOT NULL,
    premium_amount DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_policy_dates CHECK (policy_end_date > policy_start_date),
    CONSTRAINT valid_remaining_amount CHECK (remaining_amount >= 0 AND remaining_amount <= coverage_amount)
);

-- ============================================
-- 3. CLAIM MANAGEMENT
-- ============================================

CREATE TABLE claim_request (
    claim_id SERIAL PRIMARY KEY,
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customer_master(customer_id) ON DELETE CASCADE,
    policy_id INTEGER REFERENCES insurance_policy(policy_id) ON DELETE CASCADE,
    claim_amount DECIMAL(15, 2) NOT NULL,
    claim_type VARCHAR(100) NOT NULL,
    treatment_type VARCHAR(255),
    hospital_name VARCHAR(255),
    admission_date DATE,
    discharge_date DATE,
    diagnosis TEXT,
    claim_description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 
        'REJECTED', 'RESUBMITTED', 'PAYMENT_PROCESSING', 
        'PAYMENT_DONE', 'CLOSED'
    )),
    current_version INTEGER DEFAULT 1,
    submitted_by INTEGER REFERENCES users(user_id),
    reviewed_by INTEGER REFERENCES users(user_id),
    approved_by INTEGER REFERENCES users(user_id),
    processed_by INTEGER REFERENCES users(user_id),
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    approved_at TIMESTAMP,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_claim_amount CHECK (claim_amount > 0),
    CONSTRAINT valid_treatment_dates CHECK (discharge_date IS NULL OR discharge_date >= admission_date)
);

-- ============================================
-- 4. CLAIM VERSION HISTORY (Audit Trail)
-- ============================================

CREATE TABLE claim_history (
    history_id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claim_request(claim_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    claim_amount DECIMAL(15, 2),
    claim_description TEXT,
    status VARCHAR(50),
    changed_by INTEGER REFERENCES users(user_id),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    snapshot_data JSONB -- Store complete claim snapshot
);

-- ============================================
-- 5. DOCUMENT MANAGEMENT
-- ============================================

CREATE TABLE document_types (
    document_type_id SERIAL PRIMARY KEY,
    document_name VARCHAR(255) NOT NULL,
    is_mandatory BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE claim_documents (
    document_id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claim_request(claim_id) ON DELETE CASCADE,
    document_type_id INTEGER REFERENCES document_types(document_type_id),
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    uploaded_by INTEGER REFERENCES users(user_id),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER REFERENCES users(user_id),
    verification_comments TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP
);

-- ============================================
-- 6. CLAIM COMMENTS & WORKFLOW
-- ============================================

CREATE TABLE claim_comments (
    comment_id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claim_request(claim_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id),
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(50) CHECK (comment_type IN ('REVIEW', 'REJECTION', 'APPROVAL', 'QUERY', 'INTERNAL')),
    is_visible_to_customer BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE claim_workflow (
    workflow_id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claim_request(claim_id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    action_by INTEGER REFERENCES users(user_id),
    action_type VARCHAR(100),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. PAYMENT PROCESSING
-- ============================================

CREATE TABLE payment_details (
    payment_id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claim_request(claim_id) ON DELETE CASCADE,
    approved_amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255) UNIQUE,
    bank_name VARCHAR(255),
    account_number VARCHAR(100),
    ifsc_code VARCHAR(20),
    payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN (
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    payment_date DATE,
    processed_by INTEGER REFERENCES users(user_id),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_approved_amount CHECK (approved_amount > 0)
);

-- ============================================
-- 8. VALIDATION RULES ENGINE
-- ============================================

CREATE TABLE validation_rules (
    rule_id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100) NOT NULL,
    rule_condition JSONB NOT NULL,
    error_message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. FRAUD DETECTION & RISK SCORING
-- ============================================

CREATE TABLE fraud_detection_log (
    log_id SERIAL PRIMARY KEY,
    claim_id INTEGER REFERENCES claim_request(claim_id) ON DELETE CASCADE,
    risk_score DECIMAL(5, 2),
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    fraud_indicators JSONB,
    ai_model_version VARCHAR(50),
    flagged_for_review BOOLEAN DEFAULT FALSE,
    reviewed_by INTEGER REFERENCES users(user_id),
    review_outcome VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    claim_id INTEGER REFERENCES claim_request(claim_id),
    notification_type VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    sent_via VARCHAR(50) CHECK (sent_via IN ('EMAIL', 'SMS', 'IN_APP', 'ALL')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- ============================================
-- 11. AUDIT LOGS (System-wide)
-- ============================================

CREATE TABLE audit_logs (
    audit_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_customer_code ON customer_master(customer_code);
CREATE INDEX idx_policy_number ON insurance_policy(policy_number);
CREATE INDEX idx_policy_customer ON insurance_policy(customer_id);
CREATE INDEX idx_claim_number ON claim_request(claim_number);
CREATE INDEX idx_claim_status ON claim_request(status);
CREATE INDEX idx_claim_customer ON claim_request(customer_id);
CREATE INDEX idx_claim_policy ON claim_request(policy_id);
CREATE INDEX idx_claim_history_claim ON claim_history(claim_id);
CREATE INDEX idx_documents_claim ON claim_documents(claim_id);
CREATE INDEX idx_comments_claim ON claim_comments(claim_id);
CREATE INDEX idx_workflow_claim ON claim_workflow(claim_id);
CREATE INDEX idx_payment_claim ON payment_details(claim_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_fraud_claim ON fraud_detection_log(claim_id);

-- ============================================
-- TRIGGERS for Auto-Update Timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_master_updated_at BEFORE UPDATE ON customer_master
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_policy_updated_at BEFORE UPDATE ON insurance_policy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claim_request_updated_at BEFORE UPDATE ON claim_request
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_details_updated_at BEFORE UPDATE ON payment_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert Document Types
INSERT INTO document_types (document_name, is_mandatory, description) VALUES
('Medical Report', TRUE, 'Complete medical examination report'),
('Original Bills', TRUE, 'Original hospital bills and receipts'),
('Doctor Prescription', TRUE, 'Prescription from treating doctor'),
('Discharge Summary', TRUE, 'Hospital discharge summary'),
('Lab Reports', FALSE, 'Laboratory test reports'),
('X-Ray/Scan Reports', FALSE, 'Radiology reports if applicable'),
('Identity Proof', TRUE, 'Government issued ID proof'),
('Policy Document', TRUE, 'Insurance policy document');

-- Insert Validation Rules
INSERT INTO validation_rules (rule_name, rule_type, rule_condition, error_message, priority) VALUES
('Max Claim Amount', 'AMOUNT', '{"max_percentage": 100, "field": "remaining_amount"}', 'Claim amount exceeds remaining insurance coverage', 1),
('Policy Validity', 'DATE', '{"check": "policy_active", "field": "policy_end_date"}', 'Insurance policy has expired', 1),
('Mandatory Documents', 'DOCUMENT', '{"required_count": 5}', 'All mandatory documents must be uploaded', 2),
('Treatment Date Range', 'DATE', '{"check": "within_policy", "field": "admission_date"}', 'Treatment date must be within policy period', 2);

-- ============================================
-- VIEWS for Common Queries
-- ============================================

CREATE VIEW claim_summary AS
SELECT 
    cr.claim_id,
    cr.claim_number,
    cr.claim_amount,
    cr.status,
    cm.customer_code,
    u.full_name AS customer_name,
    ip.policy_number,
    ip.remaining_amount,
    cr.submitted_at,
    cr.created_at
FROM claim_request cr
JOIN customer_master cm ON cr.customer_id = cm.customer_id
JOIN users u ON cm.user_id = u.user_id
JOIN insurance_policy ip ON cr.policy_id = ip.policy_id;

CREATE VIEW pending_claims_by_role AS
SELECT 
    CASE 
        WHEN status = 'SUBMITTED' THEN 'AUDITOR'
        WHEN status = 'APPROVED' THEN 'CASHIER'
        ELSE 'CUSTOMER'
    END AS assigned_role,
    COUNT(*) AS pending_count,
    status
FROM claim_request
WHERE status IN ('SUBMITTED', 'APPROVED', 'UNDER_REVIEW')
GROUP BY status;

-- ============================================
-- END OF SCHEMA
-- ============================================

-- Made with Bob
