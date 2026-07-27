Deface::Override.new(
  :virtual_path => "projects/show",
  :name => "deface_view_projects_show_map",
  :insert_bottom => "div.splitcontentright",
  :partial => "projects/show/map"
)

Deface::Override.new(
  :virtual_path => "projects/show",
  :name => "deface_view_projects_show_other_formats",
  :insert_bottom => "div.splitcontentright",
  :partial => "projects/show/other_formats"
)
