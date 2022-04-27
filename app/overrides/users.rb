module Users
  Deface::Override.new(
    :virtual_path => "users/show",
    :name => "deface_view_users_show_other_formats",
    :insert_bottom => "div.splitcontentleft",
    :partial => "users/show/other_formats"
  )
end
