frappe.provide("frappe.workspace_quicklink");

frappe.workspace_quicklink.get_href = function (item) {
	const type = (item.quick_link_type || "").toLowerCase();

	if (!type || type === "none") return null;
	if (type === "url") return item.quick_link_url || null;
	if (!item.quick_link_to) return null;

	if (type === "report") {
		if (item.quick_link_report_type === "Report Builder" && item.quick_link_ref_doctype) {
			console.log("Generating URL for Report Builder report quick link:", item);
			// Direct Frappe URL format: /app/<doctype-slug>/view/report/<report-name>
			// Matches the URL Frappe natively produces for Report Builder reports in list view
			return `/app/${frappe.router.slug(item.quick_link_ref_doctype)}/view/report/${item.quick_link_to}`;
		}
		console.log("Generating URL for standard Query Report quick link:", item);
		// Query / Script / Custom Report — raw name, browser encodes spaces to %20
		return `/app/query-report/${item.quick_link_to}`;
	}

	return `/app/${frappe.router.slug(item.quick_link_to)}`;
};

$(document).on("app_ready", function () {
	frappe.workspace_quicklink._setup_none_block();
	frappe.workspace_quicklink._patch_sidebar();
});

// Block navigation for "None"-type items used as section headers
frappe.workspace_quicklink._setup_none_block = function () {
	$(document).on("click", ".desk-sidebar .item-anchor[data-ql-none]", function (e) {
		e.preventDefault();
		e.stopImmediatePropagation();
	});
};

// Patch sidebar_item_container to render quick-link items with the correct href
frappe.workspace_quicklink._patch_sidebar = function () {
	if (frappe.workspace_quicklink._patched) return;
	if (!frappe.views || !frappe.views.Workspace) return;

	const proto = frappe.views.Workspace.prototype;
	const original = proto.sidebar_item_container;

	proto.sidebar_item_container = function (item) {
		if (!item.is_quick_link) return original.call(this, item);

		const type = (item.quick_link_type || "").toLowerCase();

		item.indicator_color =
			item.indicator_color || this.indicator_colors[Math.floor(Math.random() * 12)];

		const href = frappe.workspace_quicklink.get_href(item);
		const is_none = type === "none";
		const is_external = !is_none && /^https?:\/\//.test(href || "");

		return $(`
<div
  class="sidebar-item-container ${item.is_editable ? "is-draggable" : ""}"
  item-parent="${item.parent_page}"
  item-name="${item.title}"
  item-public="${item.public || 0}"
  item-is-hidden="${item.is_hidden || 0}"
>
  <div class="desk-sidebar-item standard-sidebar-item ${item.selected ? "selected" : ""}">
    <a
      href="${href || "#"}"
      ${is_external ? 'target="_blank" rel="noopener noreferrer"' : ""}
      ${is_none ? "data-ql-none" : ""}
      class="item-anchor ${item.is_editable ? "" : "block-click"}"
      title="${__(item.title)}"
    >
      <span class="sidebar-item-icon" item-icon="${item.icon || "folder-normal"}">
        ${
          item.public
            ? frappe.utils.icon(item.icon || "folder-normal", "md")
            : `<span class="indicator ${item.indicator_color}"></span>`
        }
      </span>
      <span class="sidebar-item-label">${__(item.title)}</span>
    </a>
    <div class="sidebar-item-control"></div>
  </div>
  <div class="sidebar-child-item nested-container"></div>
</div>
`);
	};

	frappe.workspace_quicklink._patched = true;
};

