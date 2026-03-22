-- CreateIndex
CREATE INDEX "bookings_clientId_idx" ON "bookings"("clientId");

-- CreateIndex
CREATE INDEX "bookings_holdingId_idx" ON "bookings"("holdingId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_startDate_endDate_idx" ON "bookings"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "holdings_status_idx" ON "holdings"("status");

-- CreateIndex
CREATE INDEX "holdings_cityId_idx" ON "holdings"("cityId");

-- CreateIndex
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");

-- CreateIndex
CREATE INDEX "invoices_bookingId_idx" ON "invoices"("bookingId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_invoiceDate_idx" ON "invoices"("invoiceDate");

-- CreateIndex
CREATE INDEX "maintenance_records_holdingId_idx" ON "maintenance_records"("holdingId");

-- CreateIndex
CREATE INDEX "maintenance_records_status_idx" ON "maintenance_records"("status");

-- CreateIndex
CREATE INDEX "maintenance_records_performedDate_idx" ON "maintenance_records"("performedDate");

-- CreateIndex
CREATE INDEX "maintenance_records_maintenanceType_idx" ON "maintenance_records"("maintenanceType");

-- CreateIndex
CREATE INDEX "tasks_taskType_idx" ON "tasks"("taskType");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_holdingId_idx" ON "tasks"("holdingId");

-- CreateIndex
CREATE INDEX "tasks_scheduledDate_idx" ON "tasks"("scheduledDate");

-- CreateIndex
CREATE INDEX "tasks_taskType_status_idx" ON "tasks"("taskType", "status");
