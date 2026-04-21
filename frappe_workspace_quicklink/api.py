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

	quick_link_map = {
		row["name"]: row
		for row in frappe.get_all(
			"Workspace",
			filters={"name": ["in", workspace_names]},
			fields=["name"] + QUICK_LINK_FIELDNAMES,
		)
	}

	for page in pages:
		ql = quick_link_map.get(page["name"], {})
		for field in QUICK_LINK_FIELDNAMES:
			page[field] = ql.get(field) or (0 if field == "is_quick_link" else "")

	return result
