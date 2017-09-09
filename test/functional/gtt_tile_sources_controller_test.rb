require_relative '../test_helper'
require_relative '../../app/controllers/gtt_tile_sources_controller'

class GttTileSourcesControllerTest < ActionController::TestCase
  fixtures :users, :email_addresses

  setup do
    @request.session[:user_id] = 1
  end

  test 'should require admin' do
    @request.session[:user_id] = nil
    get :index
    assert_redirected_to '/login?back_url=http%3A%2F%2Ftest.host%2Fgtt_tile_sources'
  end

  test 'should get index' do
    get :index
    assert_response :success
    assert_template 'index'
    assert_select 'h2', 'Tile Sources'
  end

  test 'should get new' do
    get :new
    assert_response :success
    assert_template 'new'
    assert_select 'h2', /New Tile Source/
  end

  test 'should create tile source' do
    assert_difference 'GttTileSource.count' do
      post :create, tile_source: {
        name: 'test',
        type: 'GttOsmTileSource',
        options_string: {
          attributions: 'test',
          url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
        }.to_json
      }
    end

    assert ts = GttTileSource.last
    assert_equal 'test', ts.options['attributions']
    assert_equal 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
      ts.options['url']
  end

  test 'should get edit' do
    ts = create_tile_source
    get :edit, id: ts.to_param
    assert_response :success
  end

  test 'should update' do
    ts = create_tile_source
    patch :update, id: ts.to_param, tile_source: { name: 'new name', options_string: {url: 'https://example.com'}.to_json }
    assert_redirected_to gtt_tile_sources_path
    ts.reload
    assert_equal 'new name', ts.name
    assert_equal 'https://example.com', ts.options['url']
  end

  test 'should destroy tilesource' do
    ts = create_tile_source
    assert_difference 'GttTileSource.count', -1 do
      delete :destroy, id: ts.to_param
    end
  end


  private

  def create_tile_source
    RedmineGtt::Actions::CreateTileSource.(type: 'ol.source.OSM',
                                           name: 'test').tile_source
  end

end


