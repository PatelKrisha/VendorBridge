CREATE TYPE "public"."approval_action" AS ENUM('APPROVED', 'REJECTED', 'DELEGATED', 'CONFLICT_SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'DELEGATED', 'CONFLICT_SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."bank_history_status" AS ENUM('PENDING', 'ACTIVE');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'ISSUED', 'SENT', 'ACKNOWLEDGED', 'PAID', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('NEFT', 'RTGS', 'CHEQUE', 'CARD', 'UPI');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('DRAFT', 'ISSUED', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."quotation_status" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'AWARDED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."rfq_status" AS ENUM('DRAFT', 'PUBLISHED', 'CLOSED', 'AWARDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'OFFICER', 'APPROVER', 'FINANCE', 'VENDOR');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'BLACKLISTED');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(255) NOT NULL,
	"actor_id" uuid NOT NULL,
	"actor_role" varchar(50) NOT NULL,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"approver_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"action" "approval_action" NOT NULL,
	"remarks" text NOT NULL,
	"acted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"current_level" integer DEFAULT 1 NOT NULL,
	"max_levels" integer DEFAULT 1 NOT NULL,
	"status" "approval_status" DEFAULT 'PENDING' NOT NULL,
	"initiated_by" uuid NOT NULL,
	"initiated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grn_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_id" uuid NOT NULL,
	"po_item_id" uuid NOT NULL,
	"received_qty" integer NOT NULL,
	"grn_date" timestamp DEFAULT now() NOT NULL,
	"received_by" uuid NOT NULL,
	"discrepancy_flag" boolean DEFAULT false NOT NULL,
	"discrepancy_notes" text,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"po_id" uuid NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"cgst" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"sgst" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"igst" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"due_date" timestamp NOT NULL,
	"sent_at" timestamp,
	"email_delivery_status" varchar(50),
	"irn" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"gst_number" varchar(15),
	"pan" varchar(10),
	"address" text,
	"logo_url" text,
	"primary_email" varchar(255),
	"smtp_config" jsonb,
	"min_rfq_vendors" integer DEFAULT 3 NOT NULL,
	"vendor_self_register_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_gst_number_unique" UNIQUE("gst_number"),
	CONSTRAINT "organizations_pan_unique" UNIQUE("pan")
);
--> statement-breakpoint
CREATE TABLE "payment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"method" "payment_method" NOT NULL,
	"reference_number" varchar(100) NOT NULL,
	"recorded_by" uuid NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "po_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_id" uuid NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"tax_rate" numeric(4, 2) NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"po_number" varchar(50) NOT NULL,
	"quotation_id" uuid NOT NULL,
	"rfq_award_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "po_status" DEFAULT 'DRAFT' NOT NULL,
	"delivery_address" text NOT NULL,
	"payment_terms" text NOT NULL,
	"issued_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "quotation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"rfq_item_id" uuid NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"discount" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"delivery_days" integer NOT NULL,
	"tax_rate" numeric(4, 2) DEFAULT '18.00' NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"zero_price_justification" text
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "quotation_status" DEFAULT 'DRAFT' NOT NULL,
	"validity_days" integer DEFAULT 30 NOT NULL,
	"notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"submitted_at" timestamp,
	"total_amount" numeric(15, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfq_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(50) NOT NULL,
	"hsn_code" varchar(8),
	"specifications" text,
	"target_price" numeric(12, 2),
	"benchmark_price" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfq_vendor_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"rfq_number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"deadline" timestamp NOT NULL,
	"status" "rfq_status" DEFAULT 'DRAFT' NOT NULL,
	"total_budget" numeric(15, 2),
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rfqs_rfq_number_unique" UNIQUE("rfq_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'OFFICER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"mfa_secret" text,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_bank_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	"status" "bank_history_status" DEFAULT 'PENDING' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"document_name" varchar(255) NOT NULL,
	"document_url" text NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"gst_number" varchar(15) NOT NULL,
	"pan" varchar(10) NOT NULL,
	"category" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bank_details" jsonb,
	"status" "vendor_status" DEFAULT 'PENDING' NOT NULL,
	"contact_person" varchar(255),
	"contact_email" varchar(255),
	"performance_score" numeric(5, 2) DEFAULT '100.00',
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_request_id_approval_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."approval_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_actions" ADD CONSTRAINT "approval_actions_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_po_item_id_po_items_id_fk" FOREIGN KEY ("po_item_id") REFERENCES "public"."po_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_items" ADD CONSTRAINT "po_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_rfq_item_id_rfq_items_id_fk" FOREIGN KEY ("rfq_item_id") REFERENCES "public"."rfq_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_vendor_assignments" ADD CONSTRAINT "rfq_vendor_assignments_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq_vendor_assignments" ADD CONSTRAINT "rfq_vendor_assignments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bank_history" ADD CONSTRAINT "vendor_bank_history_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bank_history" ADD CONSTRAINT "vendor_bank_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_entity_id_timestamp_idx" ON "activity_logs" USING btree ("entity_id","timestamp");--> statement-breakpoint
CREATE INDEX "activity_logs_actor_id_timestamp_idx" ON "activity_logs" USING btree ("actor_id","timestamp");--> statement-breakpoint
CREATE INDEX "invoices_status_due_date_idx" ON "invoices" USING btree ("status","due_date");--> statement-breakpoint
CREATE INDEX "quotation_items_quotation_id_idx" ON "quotation_items" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "quotations_rfq_id_status_idx" ON "quotations" USING btree ("rfq_id","status");--> statement-breakpoint
CREATE INDEX "rfq_items_rfq_id_idx" ON "rfq_items" USING btree ("rfq_id");--> statement-breakpoint
CREATE INDEX "vendors_org_id_status_idx" ON "vendors" USING btree ("org_id","status");