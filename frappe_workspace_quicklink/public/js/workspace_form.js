frappe.ui.form.on("Workspace", {
	quick_link_type(frm) {
		frm.set_value("quick_link_to", "");
		frm.set_value("quick_link_url", "");
	}
});
