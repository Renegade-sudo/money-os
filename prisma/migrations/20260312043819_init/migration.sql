-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "passwordHash" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "incomeType" TEXT NOT NULL,
    "businessCategory" TEXT,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentStage" TEXT,
    "linkedReceivableId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "money_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "tithePercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "billsPercent" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "savingsPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "debtPercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "investmentPercent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "assetsPercent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "lifestylePercent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "money_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "money_allocations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalIncome" DOUBLE PRECISION NOT NULL,
    "titheAmount" DOUBLE PRECISION NOT NULL,
    "billsAmount" DOUBLE PRECISION NOT NULL,
    "savingsAmount" DOUBLE PRECISION NOT NULL,
    "debtAmount" DOUBLE PRECISION NOT NULL,
    "investmentAmount" DOUBLE PRECISION NOT NULL,
    "assetsAmount" DOUBLE PRECISION NOT NULL,
    "lifestyleAmount" DOUBLE PRECISION NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "money_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creditorName" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "priorityLevel" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingBalance" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivables" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "totalContractValue" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentStage" TEXT,
    "amountDue" DOUBLE PRECISION NOT NULL,
    "expectedDate" TIMESTAMP(3),
    "amountReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivable_payments" (
    "id" TEXT NOT NULL,
    "receivableId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivable_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "allocatedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidFrom" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bill_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "savingsType" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DOUBLE PRECISION NOT NULL,
    "actionType" TEXT NOT NULL DEFAULT 'deposit',
    "purpose" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "investmentType" TEXT NOT NULL,
    "symbol" TEXT,
    "platform" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DOUBLE PRECISION NOT NULL,
    "holdingType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateAcquired" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "purchaseCost" DOUBLE PRECISION NOT NULL,
    "estimatedValue" DOUBLE PRECISION NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifestyle_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" TEXT NOT NULL,
    "lifestyleType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lifestyle_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "software_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "softwareName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "planName" TEXT,
    "billingCycle" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startDate" TIMESTAMP(3),
    "lastPaidDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "autoCalculatedNextDue" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "software_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "money_allocations_userId_month_key" ON "money_allocations"("userId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_userId_fromCurrency_toCurrency_key" ON "exchange_rates"("userId", "fromCurrency", "toCurrency");

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_linkedReceivableId_fkey" FOREIGN KEY ("linkedReceivableId") REFERENCES "receivables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "money_plans" ADD CONSTRAINT "money_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "money_allocations" ADD CONSTRAINT "money_allocations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "money_allocations" ADD CONSTRAINT "money_allocations_planId_fkey" FOREIGN KEY ("planId") REFERENCES "money_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "receivables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_entries" ADD CONSTRAINT "bill_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_entries" ADD CONSTRAINT "savings_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifestyle_entries" ADD CONSTRAINT "lifestyle_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_subscriptions" ADD CONSTRAINT "software_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
