require_relative '../test_helper'

class UpdateProjectTest < ActiveSupport::TestCase

  test 'should add default tile source if module is enabled' do
    ts = RedmineGtt::Actions::CreateTileSource.(type: 'ol.source.OSM', name: 'default', default: true).tile_source
    RedmineGtt::Actions::CreateTileSource.(type: 'ol.source.OSM', name: 'not default', default: false)

    p = Project.create! name: 'test project', identifier: 'test-project'
    assert p.gtt_tile_sources.none? # module not enabled

    p.update_attribute :enabled_module_names, ['gtt']
    p.reload
    assert_equal [ts], p.gtt_tile_sources.to_a
  end

end


