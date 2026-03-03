function simpleApprovalLocators(page) {
    return {
        // Sidebar
        approvalTab: page.locator('text=Approvals').first(),

        // Top tabs
        myApprovalsTab: page.getByRole('tab', { name: 'My Approvals' }),
        allApprovalsTab: page.getByRole('tab', { name: 'All Approvals' }),

        // Search
        searchInput: page.getByPlaceholder('Search...'),

        // Table
        tableRows: page.locator('[role="row"]'),
        columnHeaders: page.locator('[role="columnheader"]'),

        // Toolbar buttons
        filterButton: page.locator('button').filter({ has: page.locator('svg.lucide-funnel') }),
        addColumnButton: page.locator('[data-testid="bt-add-column"]'),
        settingsButton: page.locator('button').filter({ has: page.locator('svg.lucide-settings') }),
        exportButton: page.locator('button').filter({ has: page.locator('svg.lucide-download') }),

        // Actions in row
        viewDetailsButton: page.locator('button[title="View Details"]').first(),
    };
}

module.exports = { simpleApprovalLocators };
