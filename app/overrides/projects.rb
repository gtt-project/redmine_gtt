module Projects
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
    :original => '1d2f0cb0b1439dddc34ac9c50b6b1b111fe702ce',
    :partial => "projects/show/other_formats"
  )
end
