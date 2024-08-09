Deface::Override.new(
  :virtual_path => "issues/show",
  :name => "deface_view_issues_show_map",
  :insert_before => "div.attributes",
  :original => 'c56981aa84b0fee66ff43ea773cf1444193a2862',
  :partial => "issues/show/map"
)

Deface::Override.new(
  :virtual_path => "issues/show",
  :name => "deface_view_issues_show_format_geojson",
  :insert_after => "erb[loud]:contains('PDF')",
  :original => '1419e0dcba37f62ff95372d41d9b73845889d826',
  :partial => "issues/show/geojson"
)
