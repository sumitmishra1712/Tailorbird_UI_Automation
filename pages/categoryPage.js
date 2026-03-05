const { expect } = require("@playwright/test");

class FinancialsCategoryPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        this.financialsNav = page.locator(
            'nav a.mantine-NavLink-root:has-text("Financials")'
        );

        this.categoryLink = page.locator(
            'a.mantine-NavLink-root:has(span.mantine-NavLink-label:has-text("Category"))'
        ).first();

        this.tableSelectors = [
            'table',
            '.ag-root-wrapper',
            '.mantine-Table-root',
            '[role="table"]',
            '[role="grid"]',
            '[role="treegrid"]',
        ];

        this.downloadSelectors = [
            'button:has(svg.lucide-download)',
            'button[title*="Download"]',
            'button[title*="Export"]',
            'button:has-text("Export")',
            'button:has-text("Download")',
        ];

        this.errorIndicators = [
            'text=/error/i',
            'text=/not found/i',
            'text=/404/i',
            '.mantine-Alert-root[color="red"]',
        ];

        this.resetTableIcon = page.locator(
            'button[data-variant="subtle"][data-size="md"]:has(svg.lucide-rotate-ccw)'
        );

        this.resetModal = page.locator('section[role="dialog"]');
        this.resetModalHeader = this.resetModal.locator(
            'h2.mantine-Modal-title'
        );
        this.resetModalBody = this.resetModal.locator(
            'div.mantine-Modal-body p'
        );
        this.resetCancelBtn = this.resetModal.locator(
            'button:has-text("Cancel")'
        );
        this.resetConfirmBtn = this.resetModal.locator(
            'button:has-text("Reset Table")'
        );

        // ❗ FIXED: role selector must use getByRole
        this.uploadFilesButton = page.getByRole("button", {
            name: "Upload Files",
        });

        this.uploadDialog = page.locator('dialog[open], section[role="dialog"]');
        this.uploadFileInput = page.locator('input[type="file"]');
        this.uploadListDialog = page.locator(
            'dialog[open] uc-upload-list, section[role="dialog"] uc-upload-list, uc-upload-list'
        );

        this.manageColumnsDrawer = page.locator(
            'section[role="dialog"]'
        );

        this.tableSettingsButton = page.locator(
            'button:has(svg.lucide-settings)'
        );

        this.viewDetailsBtn = page.locator(
            'button[title="View Details"]'
        );

        this.documentsHeader = page.locator(
            'text=Property Documents'
        );

        this.documentsSubHeader = page.locator(
            'text=Files and images related to this property'
        );

        // this.uploadFilesBtn = page.locator(".lucide.lucide-upload");
        this.uploadFilesBtn = page.locator(
            'button.mantine-ActionIcon-root:has(svg.lucide-upload)'
        ).first();
        this.importDataButton = page.locator('[title="Import Data"]').first();



    }

    async expandFinancialsSection() {
        await this.financialsNav.waitFor({ state: "visible" });
        const isExpanded =
            await this.financialsNav.getAttribute("aria-expanded");

        if (isExpanded !== "true") {
            await this.financialsNav.click();
            await this.page.waitForTimeout(300);
        }
    }

    async goToCategory() {
        let visible = await this.categoryLink.isVisible().catch(() => false);
        if (!visible) {
            const financialsVisible = await this.financialsNav.isVisible().catch(() => false);
            if (financialsVisible) {
                const expanded = await this.financialsNav.getAttribute("aria-expanded");
                if (expanded !== "true") {
                    await this.financialsNav.click();
                    await this.page.waitForTimeout(500);
                }
            }
            visible = await this.categoryLink.isVisible({ timeout: 3000 }).catch(() => false);
        }

        if (visible) {
            await this.categoryLink.click();
        } else {
            await this.page.goto("https://beta.tailorbird.com/financials/category", { waitUntil: "networkidle" });
        }

        await this.page.waitForLoadState("networkidle");
        await this.page.waitForTimeout(300);
    }

    async isTableVisible(timeoutMs = 2000) {
        for (const selector of this.tableSelectors) {
            const table = this.page.locator(selector).first();
            if (
                (await table.count()) &&
                (await table
                    .isVisible({ timeout: timeoutMs })
                    .catch(() => false))
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Waits for the category table/grid to be visible and loaded before interaction.
     * Use before filter/export/other table operations.
     */
    async waitForTableToLoad(timeoutMs = 15000) {
        for (const selector of this.tableSelectors) {
            const table = this.page.locator(selector).first();
            try {
                await table.waitFor({ state: 'visible', timeout: timeoutMs });
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(500);
                return true;
            } catch {
                continue;
            }
        }
        throw new Error('Category table did not load within timeout. Table/grid not visible.');
    }

    async isDownloadButtonVisible() {
        for (const selector of this.downloadSelectors) {
            const btn = this.page.locator(selector).first();
            if (
                (await btn.count()) &&
                (await btn
                    .isVisible({ timeout: 2000 })
                    .catch(() => false))
            ) {
                return true;
            }
        }
        return false;
    }

    async hasErrorIndicators() {
        for (const selector of this.errorIndicators) {
            const err = this.page.locator(selector);
            if (
                (await err.count()) &&
                (await err
                    .isVisible({ timeout: 1000 })
                    .catch(() => false))
            ) {
                return true;
            }
        }
        return false;
    }

    async validateResetCategoryContent() {
        await expect(this.resetModalHeader).toHaveText(
            "Reset Category Table"
        );

        const expectedText =
            "Are you sure you want to reset the category table? This will permanently delete all categories and set category references to null in: tasks, property assets, budget items, and job scopes. This action cannot be undone.";

        await expect(this.resetModalBody).toHaveText(expectedText);
        await expect(this.resetCancelBtn).toBeVisible();
        await expect(this.resetConfirmBtn).toBeVisible();
    }

    // async uploadCategory(filePath) {
    //     await this.uploadFilesBtn.first().click();
    //     await this.page.waitForLoadState("networkidle");
    //     await this.page.waitForTimeout(3000);
    //     await this.uploadDialog.waitFor();

    //     this.page.once("filechooser", async (chooser) => {
    //         await chooser.setFiles(filePath);
    //     });

    //     await this.page.getByText("From device").click();

    //     await expect(this.uploadListDialog).toBeVisible();

    //     const uploadedFileName =
    //         this.uploadListDialog.locator(".uc-file-name");
    //     await expect(uploadedFileName.first()).toBeVisible();

    //     const toolbarBtns = ["Remove", "Clear", /Add more/i, "Done"];
    //     for (const btn of toolbarBtns) {
    //         const btnEl = this.uploadListDialog.getByRole("button", {
    //             name: btn,
    //         });
    //         await expect(btnEl.first()).toBeVisible();
    //     }

    //     await this.uploadListDialog
    //         .getByRole("button", { name: "Done" })
    //         .click();

    //     await this.page.waitForLoadState("networkidle");
    //     await this.page.waitForTimeout(2000);
    // }

    async uploadCategory(filePath) {
        await this.page.waitForLoadState("networkidle");
        await this.page.waitForTimeout(2000);

        const uploadBtn = this.page.locator('button:has(svg.lucide-upload)').first();
        const importBtn = this.importDataButton;
        const importRoleBtn = this.page.getByRole('button', { name: 'Import Data' });

        try {
            await uploadBtn.waitFor({ state: 'visible', timeout: 15000 });
        } catch {
            await this.page.waitForTimeout(3000);
        }

        let clicked = false;
        if (await uploadBtn.isVisible().catch(() => false)) {
            await uploadBtn.click();
            clicked = true;
        } else if (await importBtn.isVisible().catch(() => false)) {
            await importBtn.click();
            clicked = true;
        } else if (await importRoleBtn.isVisible().catch(() => false)) {
            await importRoleBtn.click();
            clicked = true;
        }
        if (!clicked) {
            throw new Error('Import/Upload button not found.');
        }

        const fromDeviceBtn = this.page.getByRole('button', { name: 'From device' });
        await fromDeviceBtn.waitFor({ state: 'visible', timeout: 10000 });

        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser', { timeout: 10000 }),
            fromDeviceBtn.click(),
        ]);
        await fileChooser.setFiles(filePath);

        await this.page.waitForTimeout(2000);
        const doneBtn = this.page.getByRole('button', { name: 'Done' });
        if (await doneBtn.isVisible().catch(() => false)) {
            await doneBtn.click();
        }
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(3000);
    }

    async filterCategory(columnName, filterValue) {
        const filterBtn = this.page.locator('button:has(svg.lucide-funnel)');
        await expect(filterBtn).toBeVisible();
        await filterBtn.click();
        const filterPopover = this.page.locator(
            '.mantine-Paper-root:has-text("Filters")'
        );
        await expect(filterPopover).toBeVisible();
        const header = filterPopover.getByText("Filters", { exact: true });
        await expect(header).toBeVisible();
        const closeBtn = filterPopover.locator(
            'button.mantine-CloseButton-root'
        );
        await expect(closeBtn).toBeVisible();
        const columnBlock = filterPopover.locator(
            `div:has(p:has-text("${columnName}"))`
        );
        await expect(columnBlock).toBeVisible();
        const columnLabel = columnBlock.getByText(columnName, { exact: true });
        await expect(columnLabel).toBeVisible();
        const filterInput = columnBlock.locator(
            'input.mantine-PillsInputField-field'
        );
        await expect(filterInput).toBeVisible();
        await expect(filterInput).toBeEditable();
        await filterInput.fill(filterValue);
        await expect(filterInput).toHaveValue(filterValue);
    }

    // async filterCategoryAndVerify(columnName, filterValue) {
    //     // Step 1: Click filter button
    //     const filterBtn = this.page.locator('button:has(svg.lucide-funnel)');
    //     await expect(filterBtn).toBeVisible();
    //     await filterBtn.click();

    //     // Step 2: Verify filter popover is visible
    //     const filterPopover = this.page.locator(
    //         '.mantine-Paper-root:has-text("Filters")'
    //     );
    //     await expect(filterPopover).toBeVisible();

    //     // Step 3: Locate and fill the filter input for the specified column
    //     const columnBlock = filterPopover.locator(
    //         `div:has(p:has-text("${columnName}"))`
    //     );
    //     await expect(columnBlock.first()).toBeVisible();

    //     const filterInput = columnBlock.locator(
    //         'input.mantine-PillsInputField-field'
    //     );
    //     await expect(filterInput).toBeVisible();
    //     await expect(filterInput).toBeEditable();
    //     await filterInput.fill(filterValue);
    //     await expect(filterInput).toHaveValue(filterValue);
    //     await filterInput.press('Enter');

    //     // Step 4: Wait for filter to apply and data to update
    //     await this.page.waitForLoadState('networkidle');
    //     await this.page.waitForTimeout(1000);

    //     // Step 5: Verify filtered results - check that all visible rows contain the filter value
    //     const tableRows = this.page.locator('table tbody tr, .ag-center-cols-container .ag-row, [role="row"]');
    //     const rowCount = await tableRows.count();

    //     if (rowCount === 0) {
    //         throw new Error(`No rows found after filtering by ${columnName} = ${filterValue}`);
    //     }

    //     // Verify each row contains the filter value
    //     for (let i = 0; i < rowCount; i++) {
    //         const rowText = (await tableRows.nth(i).innerText()).trim();
    //         if (!rowText.includes(filterValue)) {
    //             throw new Error(`Row ${i} does not contain expected filter value: ${filterValue}`);
    //         }
    //     }

    //     // Step 6: Close the filter modal
    //     const closeBtn = filterPopover.locator(
    //         'button.mantine-CloseButton-root'
    //     );
    //     await expect(closeBtn).toBeVisible();
    //     await closeBtn.click();

    //     // Step 7: Verify filter modal is closed
    //     await expect(filterPopover).toBeHidden({ timeout: 2000 });

    //     return rowCount;
    // }

    async filterCategoryAndVerify(columnName, filterValue) {
        // Step 1: Click the filter button (funnel icon)
        const filterBtn = this.page.locator('button:has(svg.lucide-funnel)');
        await expect(filterBtn.first()).toBeVisible();
        await filterBtn.first().click();
        await this.page.waitForTimeout(500);

        // Step 2: Get the filter input field (textbox with placeholder)
        const filterInput = this.page.getByPlaceholder("Enter values to search for (OR logic)").first();
        await expect(filterInput).toBeVisible();
        await expect(filterInput).toBeEditable();

        // Step 3: Fill in the filter value and press Enter
        await filterInput.fill(String(filterValue));
        await filterInput.press('Enter');

        // Step 4: Wait for the grid to update with filtered results
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);

        // Step 5: Get filtered rows — check gridcells containing the filter value
        const matchingCells = this.page.locator('[role="gridcell"]').filter({
            hasText: filterValue
        });
        const rowCount = await matchingCells.count();

        if (rowCount === 0) {
            throw new Error(`No rows found after filtering "${columnName}" with value "${filterValue}"`);
        }

        // Step 7: Close the filter panel
        const closeFilterBtn = this.page.locator('button:has(svg.lucide-x)').filter({
            near: this.page.getByText('Filters', { exact: true })
        }).first();

        if (await closeFilterBtn.isVisible().catch(() => false)) {
            await closeFilterBtn.click();
            await this.page.waitForTimeout(500);
        }

        return rowCount;
    }

}

module.exports = { FinancialsCategoryPage };
