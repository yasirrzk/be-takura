-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "material_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_logs" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "type" "LogType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_plans" (
    "id" SERIAL NOT NULL,
    "plan_number" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "target_quantity" DOUBLE PRECISION NOT NULL,
    "status" "ProductionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "material_id" INTEGER NOT NULL,

    CONSTRAINT "production_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_controls" (
    "id" SERIAL NOT NULL,
    "production_plan_id" INTEGER NOT NULL,
    "quantity_ok" DOUBLE PRECISION NOT NULL,
    "quantity_ng" DOUBLE PRECISION NOT NULL,
    "defect_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finished_goods" (
    "id" SERIAL NOT NULL,
    "product_name" TEXT NOT NULL,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "finished_goods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shippings" (
    "id" SERIAL NOT NULL,
    "finished_good_id" INTEGER NOT NULL,
    "customer_name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "delivery_note_number" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shippings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "materials_material_code_key" ON "materials"("material_code");

-- CreateIndex
CREATE UNIQUE INDEX "production_plans_plan_number_key" ON "production_plans"("plan_number");

-- CreateIndex
CREATE UNIQUE INDEX "quality_controls_production_plan_id_key" ON "quality_controls"("production_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "finished_goods_product_name_key" ON "finished_goods"("product_name");

-- CreateIndex
CREATE UNIQUE INDEX "shippings_delivery_note_number_key" ON "shippings"("delivery_note_number");

-- AddForeignKey
ALTER TABLE "material_logs" ADD CONSTRAINT "material_logs_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_controls" ADD CONSTRAINT "quality_controls_production_plan_id_fkey" FOREIGN KEY ("production_plan_id") REFERENCES "production_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shippings" ADD CONSTRAINT "shippings_finished_good_id_fkey" FOREIGN KEY ("finished_good_id") REFERENCES "finished_goods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
