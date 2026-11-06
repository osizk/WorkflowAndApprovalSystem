-- CreateEnum
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'REVIEWER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "login" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "token_digest" CHAR(64) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("token_digest")
);

-- CreateTable
CREATE TABLE "reviewer_assignments" (
    "requester_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,

    CONSTRAINT "reviewer_assignments_pkey" PRIMARY KEY ("requester_id")
);

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "purpose" VARCHAR(2000) NOT NULL,
    "amount_satang" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_events" (
    "id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "type" "RequestStatus" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" VARCHAR(500),

    CONSTRAINT "request_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "purchase_requests_requester_id_created_at_id_idx" ON "purchase_requests"("requester_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "purchase_requests_reviewer_id_created_at_id_idx" ON "purchase_requests"("reviewer_id", "created_at", "id");

-- CreateIndex
CREATE INDEX "request_events_request_id_created_at_id_idx" ON "request_events"("request_id", "created_at", "id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignments" ADD CONSTRAINT "reviewer_assignments_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_assignments" ADD CONSTRAINT "reviewer_assignments_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_events" ADD CONSTRAINT "request_events_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "purchase_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_events" ADD CONSTRAINT "request_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Enforce invariants not represented by the Prisma schema.
ALTER TABLE reviewer_assignments ADD CONSTRAINT reviewer_assignment_no_self CHECK (requester_id <> reviewer_id);
ALTER TABLE purchase_requests
  ADD CONSTRAINT purchase_no_self_review CHECK (requester_id <> reviewer_id),
  ADD CONSTRAINT purchase_title_length CHECK (char_length(title) BETWEEN 3 AND 120),
  ADD CONSTRAINT purchase_purpose_length CHECK (char_length(purpose) BETWEEN 10 AND 2000),
  ADD CONSTRAINT purchase_amount_bounds CHECK (amount_satang BETWEEN 1 AND 100000000);
ALTER TABLE sessions ADD CONSTRAINT session_digest_format CHECK (token_digest ~ '^[0-9a-f]{64}$');
ALTER TABLE request_events ADD CONSTRAINT request_event_reason CHECK (
  (type <> 'REJECTED' OR reason IS NOT NULL)
  AND (type <> 'SUBMITTED' OR reason IS NULL)
  AND (reason IS NULL OR (reason ~ '[^[:space:]]' AND reason !~ '^[[:space:]]|[[:space:]]$'))
);
CREATE UNIQUE INDEX request_events_one_submission ON request_events(request_id) WHERE type = 'SUBMITTED';
CREATE UNIQUE INDEX request_events_one_terminal ON request_events(request_id) WHERE type IN ('APPROVED', 'REJECTED');
