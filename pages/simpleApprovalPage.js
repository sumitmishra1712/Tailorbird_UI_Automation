const { simpleApprovalLocators } = require('../locators/simpleApprovalLocator');
const { Logger } = require('../utils/logger');

class SimpleApprovalPage {
    constructor(page) {
        this.page = page;
        this.loc = simpleApprovalLocators(page);
    }

    async navigateToApprovalTab() {
        await this.loc.approvalTab.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1000);
    }

    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(1500);
    }

    async navigateToMyApprovalsTab() {
        await this.loc.myApprovalsTab.click();
        await this.page.waitForTimeout(800);
    }

    async navigateToAllApprovalsTab() {
        await this.loc.allApprovalsTab.click();
        await this.page.waitForTimeout(800);
    }

    async searchApprovals(term) {
        await this.loc.searchInput.fill(term);
        await this.page.waitForTimeout(600);
    }

    async clearSearch() {
        await this.loc.searchInput.clear();
        await this.page.waitForTimeout(400);
    }

    async getTableRowCount() {
        const count = await this.loc.tableRows.count();
        return Math.max(0, count - 1);
    }

    async getAllTableHeaders() {
        // Wait for the Property Name header to ensure full table is loaded
        const propertyHeader = this.page.locator('[role="columnheader"]', { hasText: 'Property Name' });
        try {
            await propertyHeader.waitFor({ state: 'visible', timeout: 10000 });
        } catch {
            // If Property Name header doesn't appear, wait a bit more for any headers
            await this.page.waitForTimeout(2000);
        }
        return await this.loc.columnHeaders.allTextContents();
    }

    async viewApprovalDetails(rowIndex = 0) {
        const viewBtn = this.page.locator('[role="treegrid"] button[title="View Details"]').first();
        try {
            await viewBtn.waitFor({ state: 'visible', timeout: 10000 });
            await viewBtn.click();
            await this.page.waitForTimeout(1000);
            return true;
        } catch {
            return false;
        }
    }

    async isApprovalModalVisible() {
        try {
            const dialog = this.page.getByRole('dialog', { name: 'Approval Details' });
            await dialog.waitFor({ state: 'visible', timeout: 5000 });
            return await dialog.isVisible();
        } catch {
            return false;
        }
    }

    async closeApprovalModal() {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(400);
        return true;
    }

    async clickFilterButton() {
        await this.loc.filterButton.click();
        await this.page.waitForTimeout(600);
        return true;
    }

    async clickSettingsButton() {
        await this.loc.settingsButton.click();
        await this.page.waitForTimeout(600);
        return true;
    }

    async clickExportButton() {
        await this.loc.exportButton.click();
        await this.page.waitForTimeout(800);
        return true;
    }

    async addColumndata() {
        await this.loc.addColumnButton.click();
        await this.page.waitForTimeout(600);
        return true;
    }

    async closeDialog() {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(400);
        return true;
    }
}

module.exports = { SimpleApprovalPage };
