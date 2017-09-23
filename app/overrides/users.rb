Deface::Override.new(
  :virtual_path => "users/_form",
  :name => "deface_view_users_form_map",
  :insert_bottom => "div.splitcontentleft",
  :partial => "users/form/map"
)


Deface::Override.new(
  :virtual_path => "users/show",
  :name => "deface_view_users_show_other_formats",
  :insert_bottom => "div.splitcontentleft",
  :partial => "users/show/other_formats"
)
