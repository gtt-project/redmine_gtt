Deface::Override.new(
  :virtual_path => "issues/show",
  :name => "deface_view_issues_show_map",
  :insert_before => "div.attributes",
  :partial => "issues/show/map"
)

Deface::Override.new(
  :virtual_path => "issues/show",
  :name => "deface_view_issues_show_format_geojson",
  :insert_after => "erb[loud]:contains('PDF')",
  :partial => "issues/show/geojson"
)
