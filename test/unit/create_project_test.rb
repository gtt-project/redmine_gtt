require_relative '../test_helper'

class CreateProjectTest < ActiveSupport::TestCase

  test 'should add default tile source' do
    ts = RedmineGtt::Actions::CreateTileSource.(type: 'ol.source.OSM', name: 'default', default: true).tile_source
    RedmineGtt::Actions::CreateTileSource.(type: 'ol.source.OSM', name: 'not default', default: false)

    assert_equal 1, GttTileSource.default.size
    p = Project.create! name: 'test project', identifier: 'test-project'
    assert_equal [ts], p.gtt_tile_sources.to_a
  end

end

