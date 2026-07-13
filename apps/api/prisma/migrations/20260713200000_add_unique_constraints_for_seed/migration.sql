-- CreateIndex
CREATE UNIQUE INDEX "CaseTemplate_name_key" ON "CaseTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VaccineSchedule_species_vaccineName_key" ON "VaccineSchedule"("species", "vaccineName");
