Deface::Override.new(
  :virtual_path => "projects/show",
  :name => "deface_view_projects_show_map",
  :insert_bottom => "div.splitcontentright",
  :original => 'b939fb5ea208476399dbfb4b253dcff0ab1ace91',
  :partial => "projects/show/map"
)

Deface::Override.new(
  :virtual_path => "projects/show",
  :name => "deface_view_projects_show_other_formats",
  :insert_bottom => "div.splitcontentright",
  :original => '868cdb34ed1c52af47076776295dcba1311914f9',
  :partial => "projects/show/other_formats"
)
