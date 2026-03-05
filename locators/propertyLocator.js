export const propertyLocators = {
    // ============ TABLE HEADERS & STRUCTURE (REVOGRID) ============
    tableViewHeader: '[role="columnheader"]',
    tableScrollContainer: '[role="treegrid"]',
    tableHeaders: '[role="columnheader"]',
    tableRows: '[role="row"]',
    tableRowCells: '[role="gridcell"]',
    gridRootWrapper: "[role='treegrid']",
    
    // ============ ROW & CELL OPERATIONS ============
    firstRowNameCell: '[role="row"]:first-of-type [role="gridcell"]:first-of-type',
    firstRowNameCellText: '[role="row"]:first-of-type [role="gridcell"]:first-of-type div',
    propertyNameCell: name => `[role="gridcell"]:has-text("${name}")`,
    rowFromCell: "xpath=ancestor::div[@role='row']",
    rowDeleteIcon: rowIndex => `[role="row"][data-rgrow="${rowIndex}"] button:not([title="View Details"])`,
    
    // ============ FILTERS & ACTIONS ============
    filterBadges: '[role="treegrid"] .mantine-Badge-label',
    filterPanelTitle: ".mantine-Paper-root p:has-text('Filter')",
    filterCheckbox: value => `input[value="${value}"]`,
    clearAllFiltersLink: '.mantine-Paper-root a:has-text("Clear All Filters")',
    
    // ============ TABS (TAKEOFFS) ============
    interiorTab: 'button[role="tab"]:has-text("Interior")',
    exteriorTab: 'button[role="tab"]:has-text("Exterior")',
    assetViewerTab: 'button[role="tab"]:has-text("Asset Viewer")',
    locationsTab: 'button[role="tab"]:has-text("Locations")',
    
    // ============ NAVIGATION & VIEWS ============
    propertiesNavLink: ".mantine-NavLink-root:has-text('Properties')",
    breadcrumbsProperties: ".mantine-Breadcrumbs-root:has-text('Properties')",
    propertiesBreadcrumbByName: name => `.mantine-Breadcrumbs-root:has-text('${name}')`,
    propertiesGridCardByName: name => `.mantine-SimpleGrid-root p:has-text('${name}')`,
    layoutListIcon: "button[title='Change view']",
    viewMenuItemLabel: view => `.mantine-Menu-itemLabel:has-text('${view}')`,
    
    // ============ CREATE/EDIT PROPERTY ============
    createPropertyButton: "button:has-text('Create Property')",
    addPropertyModalHeader: ".mantine-Modal-header:has-text('Add property')",
    addressSuggestion: address => `.mantine-Autocomplete-option:has-text("${address}")`,
    propertyTypeOption: type => `.mantine-Select-option:has-text("${type}")`,
    
    // ============ BUTTONS & ACTIONS ============
    viewDetailsButton: '[role="treegrid"] button[title="View Details"], [role="treegrid"] button:has(svg.lucide-eye)',
    viewDetailsBtn: '[role="treegrid"] button[title="View Details"], [role="treegrid"] button:has(svg.lucide-eye)',
    deleteButtonInPopover: '.mantine-Popover-dropdown button:has-text("Delete")',
    deleteConfirmBtn: ".mantine-Popover-dropdown button:has-text('Delete')",
    assetViewer: 'button:has-text("Asset Viewer")',
    selectall: 'button:has-text("Select All")',
    selectNone: 'button:has-text("Select None")',
    cancelbtn: 'button:has-text("Cancel")',
    selectDownload: 'button:has-text("Download Selected")',
    downloadIcon: '.lucide-download',
    
    // ============ SEARCH & FILTER ============
    searchInput: 'input[placeholder="Search..."]',
    
    // ============ PROPERTY DOCUMENTS ============
    documentsHeader: 'text=Property Documents',
    documentsSubHeader: 'text=Files and images related to this property',
    propertyDocumentsTitle: 'p.mantine-Text-root:has-text("Property Documents")',
    uploadFilesBtn: 'button:has-text("Upload Files")',
    uploadFilesButton: 'role=button[name="Upload Files"]',
    uploadDialog: 'dialog[open]',
    uploadFileInput: 'input[type="file"]',
    uploadListDialog: 'dialog[open] uc-upload-list',
    
    // ============ COLUMN MANAGEMENT ============
    tableSettingsButton: 'button:has(svg.lucide-settings)',
    manageColumnsDrawer: 'section[role="dialog"]',
    deleteColumnIcon: ".mantine-Group-root:has-text('Random Name') .lucide-trash2",
    addDataButton: 'button[data-testid="bt-add-column"]',
    addColumn: 'button[data-testid="bt-add-column"]',
    nameInput: 'input[placeholder^="Enter column name"]',
    nameInputModal: 'input[placeholder^="Enter column name"]',
    descInput: 'input[placeholder^="Enter column description"]',
    typeButtons: 'div[style*="grid-template-columns"] button',
    submitButton: 'button:has-text("Add column"):not([disabled])',
    submitAddColumn: 'button:has-text("Add column"):not([disabled])',
};
