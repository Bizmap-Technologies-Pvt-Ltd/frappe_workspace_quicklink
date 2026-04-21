frappe.provide("frappe.workspace_quicklink");

frappe.workspace_quicklink = {
	get_url(item) {
		const type = (item.quick_link_type || "").toLowerCase();
		if (type === "url") return item.quick_link_url || null;
		if (!type || !item.quick_link_to) return null;
		return frappe.utils.generate_route({
			type: item.quick_link_type,
			name: item.quick_link_to,
			is_query_report: type === "report" ? true : undefined,
		});
	},
};

$(document).on("app_ready", function () {
	if (!frappe.views || !frappe.views.Workspace) return;
	frappe.workspace_quicklink._patch_sidebar();
});

frappe.workspace_quicklink._patch_sidebar = function () {
	if (frappe.workspace_quicklink._patched) return;

	const proto = frappe.views.Workspace.prototype;
	const original = proto.sidebar_item_container;

	proto.sidebar_item_container = function (item) {
		if (!item.is_quick_link) return original.call(this, item);

		item.indicator_color =
			item.indicator_color || this.indicator_colors[Math.floor(Math.random() * 12)];

		const quick_url = frappe.workspace_quicklink.get_url(item);
		const href = quick_url || "#";
		const is_external = /^https?:\/\//.test(href);

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
href="${href}"
${is_external ? 'target="_blank" rel="noopener noreferrer"' : ""}
class="item-anchor ${item.is_editable ? "" : "block-click"}" title="${__(item.title)}"
>
<span class="sidebar-item-icon" item-icon=${item.icon || "folder-normal"}>
${
	item.public
		? frappe.utils.icon(item.icon || "folder-normal", "md")
		: `<span class="indicator ${item.indicator_color}"></span>`
}
</span>
<span class="sidebar-item-label">${__(item.title)}<span>
</a>
<div class="sidebar-item-control"></div>
</div>
<div class="sidebar-child-item nested-container"></div>
</div>
`);
	};

	frappe.workspace_quicklink._patched = true;
};
