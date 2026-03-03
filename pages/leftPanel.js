// leftPanelHelper.js
const locators = require('../locators/leftPanelLocator');
const { Logger } = require('../utils/logger');
const { expect } = require('@playwright/test');

module.exports = {

    /**
     * Get all left panel menu labels from both visible nav and More menu (if present)
     * Handles both full-screen (all items visible) and minimized (More menu) scenarios
     */
    getLeftPanelLabels: async function(page) {
        // Get directly visible labels from nav
        const visibleLabels = await this.getVisibleNavLabels(page);
        Logger.info(`Visible nav labels: ${JSON.stringify(visibleLabels)}`);

        // Check if More menu exists
        const hasMoreMenu = await this.hasMoreMenuButton(page);
        Logger.info(`Has More menu: ${hasMoreMenu}`);

        if (!hasMoreMenu) {
            // Full screen mode - all items visible
            return visibleLabels;
        }

        // Minimized mode - get items from More menu
        const moreLabels = await this.getMoreMenuLabels(page);
        Logger.info(`More menu labels: ${JSON.stringify(moreLabels)}`);

        // Combine and deduplicate
        const allLabels = [...new Set([...visibleLabels, ...moreLabels])].filter(
            (label) => label && label !== 'More'
        );

        return allLabels;
    },

    /**
     * Get labels that are directly visible in nav (not in More menu)
     */
    getVisibleNavLabels: async function(page) {
        // Wait for nav to be ready
        await page.locator('nav').waitFor({ state: 'visible' });
        await page.waitForTimeout(200);
        
        const items = page.locator(locators.leftPanelLabels);
        const count = await items.count();
        Logger.info(`Total nav labels found: ${count}`);

        const labels = [];
        for (let i = 0; i < count; i++) {
            const text = (await items.nth(i).innerText()).trim();
            if (text && text !== 'More') {
                labels.push(text);
                Logger.info(`Fetched label: "${text}"`);
            }
        }
        return labels;
    },

    /**
     * Check if More button/link exists in the nav
     */
    hasMoreMenuButton: async function(page) {
        const moreButton = page.locator('nav a.mantine-NavLink-root').filter({ hasText: 'More' });
        return await moreButton.count() > 0;
    },

    /**
     * Open the More menu and return labels from it
     */
    getMoreMenuLabels: async function(page) {
        const more = await this.openMoreMenu(page);
        if (!more) return [];

        const labels = [];
        const menuItems = more.locator('[role="menuitem"]');
        const count = await menuItems.count();

        for (let i = 0; i < count; i++) {
            const text = (await menuItems.nth(i).innerText()).trim();
            if (text) {
                labels.push(text);
                Logger.info(`Fetched More menu label: "${text}"`);
            }
        }

        // Close menu
        try {
            await page.keyboard.press('Escape');
        } catch (e) {
            // Ignore if already closed
        }

        return labels;
    },

    /**
     * Open the More menu and return the menu element
     */
    openMoreMenu: async function(page) {
        const moreButton = page.locator('nav a.mantine-NavLink-root').filter({ hasText: 'More' }).first();
        if (await moreButton.count() === 0) return null;

        await moreButton.click();
        await page.waitForTimeout(300);

        // The menu appears as a sibling or overlay
        const menu = page.locator('[role="menu"]').first();
        return menu;
    },



    /**
     * Get locators for a section (parent and its collapse container)
     */
    getSectionLocators: async function (page, label) {
        const parent = page.locator(locators.leftPanelItem(label)).first();
        const collapse = parent.locator(locators.collapseContainer);
        return { parent, collapse };
    },

    /**
     * Ensure a section is visible and expanded
     * Handles both direct nav items and items in More menu
     */
    ensureSectionExpanded: async function (page, sectionLabel) {
        // Check if section exists in direct nav - use filter for reliability
        const directParent = page.locator('nav a.mantine-NavLink-root').filter({ hasText: sectionLabel }).first();
        const directExists = await directParent.count() > 0;

        if (directExists) {
            // Section is in main nav
            const collapse = directParent.locator(locators.collapseContainer);
            await directParent.waitFor({ state: 'attached' });
            await directParent.scrollIntoViewIfNeeded();
            await directParent.waitFor({ state: 'visible' });
            const visible = await this.listVisibleSuboptions(collapse);
            if (visible.length === 0) {
                await directParent.click();
                await page.waitForTimeout(800);
            }
        } else {
            // Section might be in More menu
            const hasMore = await this.hasMoreMenuButton(page);
            if (hasMore) {
                const more = await this.openMoreMenu(page);
                if (more) {
                    // Find the section in the menu
                    const sectionInMenu = more.locator(`[role="menuitem"] >> text=${sectionLabel}`).first();
                    if (await sectionInMenu.count() > 0) {
                        // It's in the menu, but we may not be able to expand from menu
                        Logger.info(`Section ${sectionLabel} found in More menu`);
                    }
                }
                // Close menu
                try {
                    await page.keyboard.press('Escape');
                } catch (e) {
                    // Ignore
                }
            }
        }
    },

    /**
     * Get locator for a child menu item under a section
     * Handles both direct nav child items and items in More menu
     */
    getChildMenuLocator: async function (page, parentSectionLabel, childLabel) {
        // Check if parent section exists in direct nav - use filter for reliability
        const parentLocator = page.locator('nav a.mantine-NavLink-root').filter({ hasText: parentSectionLabel }).first();
        if (await parentLocator.count() > 0) {
            // Parent is in direct nav
            const collapseLocator = parentLocator.locator(locators.collapseContainer);
            return collapseLocator.locator(`a.mantine-NavLink-root:has(span.mantine-NavLink-label:has-text("${childLabel}"))`);
        }

        // Check if child is in More menu
        const hasMore = await this.hasMoreMenuButton(page);
        if (hasMore) {
            const more = await this.openMoreMenu(page);
            if (more) {
                const childInMenu = more.locator(`[role="menuitem"] >> text=${childLabel}`).first();
                if (await childInMenu.count() > 0) {
                    try {
                        await page.keyboard.press('Escape');
                    } catch (e) {
                        // Ignore
                    }
                    return childInMenu;
                }
            }
            // Close menu
            try {
                await page.keyboard.press('Escape');
            } catch (e) {
                // Ignore
            }
        }

        return null;
    },

    /**
     * List visible sub-options under a collapse container
     */
    listVisibleSuboptions: async function (collapseLocator) {
        const anchors = collapseLocator.locator(locators.subOptions);
        const n = await anchors.count();
        const visibleNames = [];
        for (let i = 0; i < n; i++) {
            const el = anchors.nth(i);
            if (await el.isVisible()) {
                const text = (await el.innerText()).trim();
                if (text) visibleNames.push(text);
            }
        }
        return visibleNames;
    },

    /**
     * Test expand/collapse functionality for a section
     * Handles both full screen (direct nav) and minimized (More menu) scenarios
     */
    runTwoClickTest: async function (page, label) {
        // Wait for page load and section rendering
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(300);

        // Use filter to find sections (more reliable than CSS :has-text())
        let directParent = page.locator('nav a.mantine-NavLink-root').filter({ hasText: label }).first();
        let directExists = await directParent.count() > 0;

        if (!directExists) {
            // Section is not in direct nav, check More menu
            const hasMore = await this.hasMoreMenuButton(page);
            if (hasMore) {
                Logger.info(`Section ${label} is in More menu (minimized mode)`);
                Logger.info(`Skipping expand/collapse test`);
                return;
            }
            throw new Error(`Section not found: ${label}`);
        }

        Logger.info(`Found ${label} section`);

        // Ensure visibility
        await directParent.scrollIntoViewIfNeeded();
        await directParent.waitFor({ state: 'visible' });
        await page.waitForTimeout(300);

        // Get collapse container
        const collapse = directParent.locator(locators.collapseContainer);
        const collapseExists = await collapse.count() > 0;
        
        if (!collapseExists) {
            Logger.info(`No collapse container for ${label}`);
            return;
        }

        const beforeList = await this.listVisibleSuboptions(collapse);
        Logger.info(`[Before] ${label} visible: ${beforeList}`);

        // Handle already collapsed state
        if (beforeList.length === 0) {
            Logger.info(`Expanding ${label} first`);
            await directParent.click();
            await page.waitForTimeout(800);
        }

        // Test collapse
        await directParent.click();
        await page.waitForTimeout(800);
        const afterCollapse = await this.listVisibleSuboptions(collapse);
        Logger.info(`[After Collapse] ${label} visible: ${afterCollapse}`);
        expect(afterCollapse.length).toBe(0);

        // Test expand
        await directParent.click();
        await page.waitForTimeout(800);
        const afterExpand = await this.listVisibleSuboptions(collapse);
        Logger.info(`[After Expand] ${label} visible: ${afterExpand}`);
        expect(afterExpand.length).toBeGreaterThan(0);
    }

};
