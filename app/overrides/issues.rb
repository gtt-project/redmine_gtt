Deface::Override.new(
  :virtual_path => "issues/index",
  :name => "deface_view_issues_index_map",
  :insert_after => "erb[loud]:contains('error_messages_for')",
  :partial => "issues/index/map"
)

Deface::Override.new(
  :virtual_path => "issues/index",
  :name => "deface_view_issues_index_format_geojson",
  :insert_after => "erb[loud]:contains('PDF')",
  :partial => "issues/index/geojson"
)

Deface::Override.new(
  :virtual_path => "issues/new",
  :name => "deface_view_issues_new_map",
  :insert_before => "div.box",
  :partial => "issues/form/map"
)

Deface::Override.new(
  :virtual_path => "issues/_edit",
  :name => "deface_view_issues_edit_map",
  :insert_before => "div.box",
  :partial => "issues/form/map"
)

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
