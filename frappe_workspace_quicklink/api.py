import frappe
from frappe import _
from frappe.desk.desktop import get_workspace_sidebar_items as _original_get_sidebar_items


QUICK_LINK_FIELDNAMES = [
	"is_quick_link",
	"quick_link_type",
	"quick_link_to",
	"quick_link_url",
]


@frappe.whitelist()
def get_workspace_sidebar_items():
	result = _original_get_sidebar_items()
	pages = result.get("pages", [])

	if not pages:
		return result

	workspace_names = [p["name"] for p in pages]

	# Bulk-fetch quick link fields for all workspaces
	quick_link_map = {
		row["name"]: row
		for row in frappe.get_all(
			"Workspace",
			filters={"name": ["in", workspace_names]},
			fields=["name"] + QUICK_LINK_FIELDNAMES,
		)
	}

	# Collect all report names from Report-type quick links for bulk metadata fetch
	report_names = [
		row["quick_link_to"]
		for row in quick_link_map.values()
		if row.get("quick_link_type") == "Report" and row.get("quick_link_to")
	]

	report_meta_map = {}
	if report_names:
		for row in frappe.get_all(
			"Report",
			filters={"name": ["in", report_names]},
			fields=["name", "report_type", "ref_doctype"],
		):
			report_meta_map[row["name"]] = row

	for page in pages:
		ql = quick_link_map.get(page["name"], {})

		# Attach quick link fields
		for field in QUICK_LINK_FIELDNAMES:
			page[field] = ql.get(field) or (0 if field == "is_quick_link" else "")

		# Attach report metadata for Report-type quick links
		if ql.get("quick_link_type") == "Report" and ql.get("quick_link_to"):
			meta = report_meta_map.get(ql["quick_link_to"], {})
			page["quick_link_report_type"] = meta.get("report_type") or ""
			page["quick_link_ref_doctype"] = meta.get("ref_doctype") or ""
		else:
			page["quick_link_report_type"] = ""
			page["quick_link_ref_doctype"] = ""

	return result
