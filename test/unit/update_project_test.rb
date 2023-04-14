require_relative '../test_helper'

class UpdateProjectTest < ActiveSupport::TestCase

  test 'should add default map layer if module is enabled' do
    ts = RedmineGtt::Actions::CreateMapLayer.(layer: 'Tile', name: 'default', default: true).map_layer
    RedmineGtt::Actions::CreateMapLayer.(layer: 'Tile', name: 'not default', default: false)

    p = Project.create! name: 'test project', identifier: 'test-project'
    assert p.gtt_map_layers.none? # module not enabled

    p.update_attribute :enabled_module_names, ['gtt']
    p.reload
    assert_equal [ts], p.gtt_map_layers.to_a
  end

end


