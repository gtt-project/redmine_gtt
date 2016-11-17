Deface::Override.new(
  :virtual_path => "projects/_form",
  :name => "deface_view_projects_form_map",
  :insert_after => "div.box",
  :partial => "projects/form/map"
)

Deface::Override.new(
  :virtual_path => "projects/show",
  :name => "deface_view_projects_show_map",
  :insert_bottom => "div.splitcontentright",
  :partial => "projects/show/map"
)
