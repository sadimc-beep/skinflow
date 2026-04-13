export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    gender: string;
    blood_group: string;
    phone_primary: string;
    phone_secondary: string;
    email: string;
    national_id: string;
    passport_number: string;
    occupation: string;
    marital_status: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    emergency_contact_name: string;
    emergency_contact_relation: string;
    emergency_contact_phone: string;
    has_known_allergies: boolean;
    has_chronic_conditions: boolean;
    created_at: string;
    updated_at: string;
}

export type PatientFormData = Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'is_active'>;

// =========== NEW TYPES FOR APPOINTMENTS & PROVIDERS ===========

export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
}

export interface Provider {
    id: number;
    user_details: User;   // serialized as user_details (source='user')
    provider_type: 'DOCTOR' | 'THERAPIST';
    specialization: string;
    registration_number: string;
    max_discount_percentage: string;     // Django DecimalField rendered as string
    default_consultation_fee: string;   // Django DecimalField rendered as string
    is_active: boolean;
}

export type AppointmentStatus = 'SCHEDULED' | 'ARRIVED' | 'READY_FOR_CONSULT' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
    id: number;
    patient: number;                       // Foreign Key ID
    patient_details?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'phone_primary'>; // If the backend serializer nests it
    provider: number;                      // Foreign Key ID
    provider_details?: Pick<Provider, 'id' | 'default_consultation_fee'> & { name: string };
    date_time: string;                     // ISO datetime
    end_time?: string;                     // ISO datetime (optional)
    status: AppointmentStatus;
    fee: string;                           // Django DecimalField rendered as string
    fee_waiver_requested: boolean;
    fee_waiver_reason: string;
    fee_waiver_approved: boolean | null;   // null = pending, true = approved, false = denied
    is_fee_paid?: boolean;
    consultation_id?: number | null;
    notes: string;
    created_at: string;
    updated_at: string;
}

export interface AppointmentFormData {
    patient: number;
    provider: number;
    date_time: string;
    notes?: string;
}

// =========== NEW TYPES FOR CLINICAL EXPERIENCES ===========

export interface ClinicalIntake {
    id: number;
    appointment: number;
    blood_pressure: string;
    pulse: string;
    weight: string;
    height: string;
    bmi: string;
    chief_complaint: string;
    created_at: string;
}

export type ConsultationStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED';

export interface PrescriptionMedication {
    id: number;
    prescription: number;
    medicine: number;
    medicine_name?: string;
    dose: string;
    route: string;
    frequency: string;
    duration: string;
    recommendations: string;
    instructions: string;
}

export interface PrescriptionProcedure {
    id: number;
    prescription?: number;
    procedure_type: number;
    procedure_name?: string;
    sessions_planned: number;
    base_price: string;
    manual_discount: string;
    is_selected_for_billing: boolean;
    billed_invoice?: number | null;
}

export interface PrescriptionProduct {
    id: number;
    prescription: number;
    product?: number;
    product_name: string;
    quantity: number;
    price: string;
    manual_discount: string;
    is_selected_for_billing: boolean;
    billed_invoice?: number | null;
}

export interface Prescription {
    id: number;
    consultation: number;
    medications: PrescriptionMedication[];
    procedures: PrescriptionProcedure[];
    products: PrescriptionProduct[];
}

export interface TreatmentPlanItem {
    id: number;
    treatment_plan: number;
    procedure_type: number;
    procedure_name?: string;
    planned_sessions: number;
}

export interface TreatmentPlan {
    id: number;
    patient: number;
    name: string;
    items: TreatmentPlanItem[];
    created_at: string;
}

export interface Consultation {
    id: number;
    patient: number;
    patient_details?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'phone_primary' | 'gender' | 'date_of_birth'>;
    provider: number;
    provider_details?: Pick<Provider, 'id' | 'specialization'> & { name: string };
    appointment: number | null;
    status: ConsultationStatus;
    chief_complaint: string;
    history_of_present_illness: string;
    examination_findings: string;
    assessment_and_plan: string;
    prescription?: Prescription;
    created_at: string;
    updated_at: string;
}

export type ConsultationFormData = Partial<Omit<Consultation, 'id' | 'patient_details' | 'provider_details' | 'prescription' | 'created_at' | 'updated_at'>>;

export type ProcedureSessionStatus = 'PLANNED' | 'STARTED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface ProcedureSession {
    id: number;
    organization: number;
    treatment_plan_item: number | null;
    consultation: number | null;
    appointment: number | null;
    appointment_details?: Appointment;
    room: number | null;
    provider: number | null;
    provider_details?: Pick<Provider, 'id'> & { name: string };
    status: ProcedureSessionStatus;
    entitlement: number | null;
    consent_form: number | null;
    clinical_photo: number | null;
    specialized_data?: Record<string, any>;
    consumable_cost?: string;
    // Computed fields from serializer (from appointment OR entitlement)
    patient_details?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'phone_primary'>;
    procedure_name?: string | null;
    created_at: string;
    updated_at: string;
}

// =========== NEW TYPES FOR BILLING & INVOICES ===========

export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'REFUNDED';
export type InvoiceType = 'CONSULTATION' | 'TREATMENT_PLAN' | 'PRODUCT' | 'MIXED' | 'OTHER';

export interface InvoiceItem {
    id: number;
    invoice: number;
    description: string;
    reference_id?: number | null;
    reference_model?: string;
    procedure_type?: number | null;
    quantity: number;
    unit_price: string;
    discount: string;
    net_price: string;
    is_fulfilled: boolean;
    fulfilled_at?: string | null;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'BKASH' | 'NAGAD' | 'BANK_TRANSFER' | 'ADJUSTMENT' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
    id: number;
    invoice: number;
    method: PaymentMethod;
    amount: string;
    status: PaymentStatus;
    transaction_id: string;
    created_at: string;
}

export interface Invoice {
    id: number;
    patient: number;
    patient_details?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'phone_primary'>;
    appointment?: number | null;
    invoice_type: InvoiceType;
    status: InvoiceStatus;
    subtotal: string;
    discount_total: string;
    tax_total: string;
    total: string;
    balance_due: string;
    items?: InvoiceItem[];
    payments?: Payment[];
    created_at: string;
    updated_at: string;
}

export interface Entitlement {
    id: number;
    patient: number;
    invoice: number;
    invoice_item: number;
    entitlement_type: 'PROCEDURE' | 'PRODUCT';
    procedure_type?: number | null;
    procedure_name?: string;
    total_qty: number;
    used_qty: number;
    remaining_qty: number;
    is_active: boolean;
    created_at: string;
}

