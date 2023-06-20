require_relative '../test_helper'

class CreateProjectTest < ActiveSupport::TestCase

  test 'should add default map layer if module enabled' do
    ts = RedmineGtt::Actions::CreateMapLayer.(layer: 'Tile', name: 'default', default: true).map_layer
    RedmineGtt::Actions::CreateMapLayer.(layer: 'Tile', name: 'not default', default: false)
    assert_equal 1, GttMapLayer.default.size

    p = Project.create! name: 'test project', identifier: 'test-project'
    assert p.gtt_map_layers.none? # module not enabled

    p = Project.create! name: 'test project', identifier: 'test-project-2', enabled_module_names: ['gtt']
    assert_equal [ts], p.gtt_map_layers.to_a
  end

end

