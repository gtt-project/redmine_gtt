require_relative '../test_helper'

class UpdateProjectSettingsTest < ActiveSupport::TestCase
  fixtures :projects

  test 'should save tile sources' do
    p = Project.find 'ecookbook'
    ts = GttTileSource.create! name: 'test', type: 'ol.source.OSM'
    form = GttConfiguration.from_params gtt_tile_source_ids: [ ts.id ]
    form.project = p
    r = RedmineGtt::Actions::UpdateProjectSettings.( form )

    assert r.settings_saved?

    p.reload
    assert_equal [ts], p.gtt_tile_sources.to_a
  end
end


