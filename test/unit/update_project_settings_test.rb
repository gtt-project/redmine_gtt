require_relative '../test_helper'

class UpdateProjectSettingsTest < GttTest
  fixtures :projects

  test 'should save map layer' do
    p = Project.find 'ecookbook'
    ts = GttMapLayer.create! name: 'test', layer: 'Tile'
    form = GttConfiguration.from_params gtt_map_layer_ids: [ ts.id ]
    form.project = p
    r = RedmineGtt::Actions::UpdateProjectSettings.( form )

    assert r.settings_saved?

    p.reload
    assert_equal [ts], p.gtt_map_layers.to_a
  end

  test 'should validate invalid multipolygon geometry' do
    p = Project.find 'ecookbook'
    coordinates = [
      [
        [[135.0, 35.0], [136.0, 35.0], [136.0, 36.0], [135.0, 36.0], [135.0, 35.0]]
      ],
      [
        [[136.0, 35.0], [137.0, 35.0], [137.0, 36.0], [136.0, 36.0], [136.0, 35.0]]
      ]
    ]

    form = GttConfiguration.from_params geojson: multipolygon_geojson(coordinates)
    form.project = p
    r = RedmineGtt::Actions::UpdateProjectSettings.( form )

    assert r.settings_saved?

    p.reload
    assert_include 'Geometry is invalid', p.errors.full_messages
  end

  test 'should save valid multipolygon geometry' do
    p = Project.find 'ecookbook'
    coordinates = [
      [
        [[135.0, 35.0], [136.0, 35.0], [136.0, 36.0], [135.0, 36.0], [135.0, 35.0]]
      ],
      [
        [[137.0, 35.0], [138.0, 35.0], [138.0, 36.0], [137.0, 36.0], [137.0, 35.0]]
      ]
    ]

    form = GttConfiguration.from_params geojson: multipolygon_geojson(coordinates)
    form.project = p
    r = RedmineGtt::Actions::UpdateProjectSettings.( form )

    assert r.settings_saved?

    p.reload
    assert_equal coordinates, JSON.parse(p.geojson)['geometry']['coordinates']
  end

end
