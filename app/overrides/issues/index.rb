Deface::Override.new(
  :virtual_path => "issues/index",
  :name => "deface_view_issues_index_map",
  :insert_after => "h2",
  :original => 'b807967c7184cb012c4bd5ccce90893349bc66e3',
  :partial => "issues/index/map"
)

Deface::Override.new(
  :virtual_path => "issues/index",
  :name => "deface_view_issues_index_format_geojson",
  :insert_after => "erb[loud]:contains('PDF')",
  :original => '2b4102bf118f0a9866cf50477dce9cc7a78da6d5',
  :partial => "issues/index/geojson"
)
