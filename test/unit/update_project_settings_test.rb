require_relative '../test_helper'

class UpdateProjectSettingsTest < ActiveSupport::TestCase
  fixtures :projects

  test 'should save tile sources' do
    p = Project.find 'ecookbook'
    ts = GttTileSource.create! name: 'test', type: 'ol.source.OSM'
    r = RedmineGtt::Actions::UpdateProjectSettings.(
      p, gtt_tile_source_ids: [ ts.id ]
    )

    assert r.settings_saved?

    p.reload
    assert_equal [ts], p.gtt_tile_sources.to_a
  end
end


