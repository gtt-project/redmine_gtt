module Users
  Deface::Override.new(
    :virtual_path => "users/show",
    :name => "deface_view_users_show_other_formats",
    :insert_bottom => "div.splitcontentleft",
    :original => 'abe916df0691ebe8848cfc0dde536abd3bfe39b8',
    :partial => "users/show/other_formats"
  )
end
