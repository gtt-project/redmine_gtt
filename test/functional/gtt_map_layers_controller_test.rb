require_relative '../test_helper'
require_relative '../../app/controllers/gtt_map_layers_controller'

class GttMapLayersControllerTest < ActionController::TestCase
  fixtures :users, :email_addresses

  setup do
    @request.session[:user_id] = 1
  end

  test 'should require admin' do
    @request.session[:user_id] = nil
    get :index
    assert_redirected_to '/login?back_url=http%3A%2F%2Ftest.host%2Fgtt_map_layers'
  end

  test 'should get index' do
    get :index
    assert_response :success
    assert_template 'index'
    assert_select 'h2', 'Map layers'
  end

  test 'should get new' do
    get :new
    assert_response :success
    assert_template 'new'
    assert_select 'h2', 'Map layers » New map layer'
  end

  test 'should create map layer' do
    assert_difference 'GttMapLayer.count' do
      post :create, params: {
        map_layer: {
          name: 'test',
          layer: 'Tile',
          source_options_string: {
            attributions: 'test',
            url: 'https://tile.openstreetmap.jp/{z}/{x}/{y}.png'
          }.to_json
        }
      }
    end

    assert_redirected_to '/gtt_map_layers'
    assert ts = GttMapLayer.last
    assert_equal 'test', ts.source_options['attributions']
    assert_equal 'https://tile.openstreetmap.jp/{z}/{x}/{y}.png',
      ts.source_options['url']
  end

  test 'should create map layer and continue' do
    assert_difference 'GttMapLayer.count' do
      post :create, params: {
        map_layer: {
          name: 'test',
          layer: 'Tile',
          source_options_string: {
            attributions: 'test',
            url: 'https://tile.openstreetmap.jp/{z}/{x}/{y}.png'
          }.to_json
        },
        continue: 'Create and continue'
      }
    end

    assert_redirected_to '/gtt_map_layers/new'
    assert ts = GttMapLayer.last
    assert_equal 'test', ts.source_options['attributions']
    assert_equal 'https://tile.openstreetmap.jp/{z}/{x}/{y}.png',
      ts.source_options['url']
  end

  test 'should get edit' do
    ts = create_map_layer
    get :edit, params: {id: ts.to_param}
    assert_response :success
  end

  test 'should update' do
    ts = create_map_layer
    patch :update, params: {id: ts.to_param, map_layer: { name: 'new name', source_options_string: {url: 'https://example.com'}.to_json }}
    assert_redirected_to gtt_map_layers_path
    ts.reload
    assert_equal 'new name', ts.name
    assert_equal 'https://example.com', ts.source_options['url']
  end

  test 'should destroy MapLayer' do
    ts = create_map_layer
    assert_difference 'GttMapLayer.count', -1 do
      delete :destroy, params: {id: ts.to_param}
    end
  end

  private

  def create_map_layer
    RedmineGtt::Actions::CreateMapLayer.(layer: 'Tile', name: 'test').map_layer
  end

end


