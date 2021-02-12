Deface::Override.new(
  :virtual_path => "issues/index",
  :name => "deface_view_issues_index_map",
  :original => 'b807967c7184cb012c4bd5ccce90893349bc66e3',
  :insert_after => "h2",
  :partial => "issues/index/map"
)

Deface::Override.new(
  :virtual_path => "issues/index",
  :name => "deface_view_issues_index_format_geojson",
  :original => '2b4102bf118f0a9866cf50477dce9cc7a78da6d5',
  :insert_after => "erb[loud]:contains('PDF')",
  :partial => "issues/index/geojson"
)

Deface::Override.new(
  :virtual_path => "issues/show",
  :name => "deface_view_issues_show_map",
  :original => 'f8b29d3fa9c4998090a16b8392242cafbc8cbbcf',
  :insert_before => "div.attributes",
  :partial => "issues/show/map"
)

Deface::Override.new(
  :virtual_path => "issues/show",
  :name => "deface_view_issues_show_format_geojson",
  :original => '1419e0dcba37f62ff95372d41d9b73845889d826',
  :insert_after => "erb[loud]:contains('PDF')",
  :partial => "issues/show/geojson"
)
