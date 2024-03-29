require_relative '../test_helper'

class ProjectsApiTest < Redmine::IntegrationTest
  fixtures :users, :email_addresses, :roles, :projects, :members, :member_roles

  setup do
    User.current = nil
    @project = Project.find 'ecookbook'
    @project.enabled_modules.create name: 'gtt'
    @subproject1 = Project.find 'subproject1'
    @subproject1.enabled_modules.create name: 'gtt'
  end

  test 'should filter projects by geometry' do
    get '/projects.xml'
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert projects.any?
    assert_equal Project.visible.count, projects.size

    get '/projects.xml', params: {contains: 'POINT(123.271 9.35 0.0)'}
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 0, projects.size

    geo = {
      'type' => 'Feature',
      'geometry' => {
        'type' => 'Polygon',
        'coordinates' => [
          [[123.269691,9.305099,0.0], [123.279691,9.305099,0.0],[123.279691,9.405099,0.0],[123.269691,9.405099,0.0]]
        ]
      }
    }
    geojson = geo.to_json

    @project.update_attribute :geojson, geojson
    @subproject1.update_attribute :geojson, geojson
    assert @project.visible? && @subproject1.visible?

    get '/projects.xml', params: {contains: 'POINT(123.271 9.55 0.0)'}
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 0, projects.size

    get '/projects.xml', params: {contains: 'POINT(123.271 9.35 0.0)'}
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 2, projects.size, xml.to_s
    assert_equal ['ecookbook', 'subproject1'], projects.xpath('identifier').map {|n| n.text}
    assert_equal 0, projects.xpath('geojson').size, projects.to_s

  end

  test 'should include geojson (on demand)' do
    geo = {
      'type' => 'Feature',
      'geometry' => {
        'type' => 'Polygon',
        'coordinates' => [
          [[123.269691,9.305099,0.0], [123.279691,9.305099,0.0],[123.279691,9.405099,0.0],[123.269691,9.405099,0.0], [123.269691,9.305099,0.0]]
        ]
      }
    }
    geojson = geo.to_json

    @project.update_attribute :geojson, geojson
    # xml format - index api
    get '/projects.xml?include=geometry'
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/projects/project[id=1]/geojson').text
    assert json.present?
    assert_match(/123\.269691/, json)
    assert_equal geo['geometry'], JSON.parse(json)['geometry'], json
    # xml format - show api
    get '/projects/1.xml'
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/project/geojson').text
    assert json.present?
    assert_match(/123\.269691/, json)
    assert_equal geo['geometry'], JSON.parse(json)['geometry'], json

    # json format - index api
    get '/projects.json?include=geometry'
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['projects'].detect{|p|p['id'] == @project.id}['geojson']
    assert_equal geo['geometry'], hsh['geometry']
    # json format - show api
    get '/projects/1.json'
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['project']['geojson']
    assert_equal geo['geometry'], hsh['geometry']
  end

  test 'should include empty geojson (on demand)' do
    @project.update_attribute :geojson, nil
    # xml format - index api
    get '/projects.xml?include=geometry'
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/projects/project[id=1]/geojson').text
    assert_equal "", json
    # xml format - show api
    get '/projects/1.xml'
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/project/geojson').text
    assert_equal "", json

    # json format - index api
    get '/projects.json?include=geometry'
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['projects'].detect{|p|p['id'] == @project.id}['geojson']
    assert_nil hsh
    # json format - show api
    get '/projects/1.json'
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['project']['geojson']
    assert_nil hsh
  end

  test 'should filter projects by query and geometry' do
    # default
    get '/projects.xml'
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert projects.any?
    assert_equal Project.visible.count, projects.size

    # query filter (only root projects)
    get '/projects.xml', params: {
      'f[]': 'parent_id',
      'op[parent_id]': '!*'
    }
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal Project.visible.where(parent_id: nil).count, projects.size
    assert_equal 'ecookbook', projects.xpath('identifier').text
    assert_equal 0, projects.xpath('geojson').size, projects.to_s

    # set geometry to ecookbook and subproject1
     geo = {
      'type' => 'Feature',
      'geometry' => {
        'type' => 'Polygon',
        'coordinates' => [
          [[123.269691,9.305099,0.0], [123.279691,9.305099,0.0],[123.279691,9.405099,0.0],[123.269691,9.405099,0.0]]
        ]
      }
    }
    geojson = geo.to_json

    @project.update_attribute :geojson, geojson
    @subproject1.update_attribute :geojson, geojson
    assert @project.visible? && @subproject1.visible?

    # include=geometry
    get '/projects.xml', params: {
      'f[]': 'parent_id',
      'op[parent_id]': '!*',
      include: 'geometry'
    }
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 1, projects.size
    assert_equal 'ecookbook', projects.xpath('identifier').text
    assert_equal 1, projects.xpath('geojson').size, projects.to_s

    # contains=(wkt)
    get '/projects.xml', params: {
      'f[]': 'parent_id',
      'op[parent_id]': '!*',
      contains: 'POINT(123.271 9.35 0.0)'
    }
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 1, projects.size, xml.to_s
    assert_equal 'ecookbook', projects.xpath('identifier').text
    assert_equal 0, projects.xpath('geojson').size, projects.to_s

    # include=geometry and contains=(wkt)
    get '/projects.xml', params: {
      'f[]': 'parent_id',
      'op[parent_id]': '!*',
      include: 'geometry',
      contains: 'POINT(123.271 9.35 0.0)'
    }
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 1, projects.size, xml.to_s
    assert_equal 'ecookbook', projects.xpath('identifier').text
    assert_equal 1, projects.xpath('geojson').size, projects.to_s
  end

  test 'GET /projects.xml with include=layers should return layers' do
    ts = RedmineGtt::Actions::CreateMapLayer.(layer: 'Tile', name: 'default', default: true).map_layer
    @project.gtt_map_layers = [ts]
    @subproject1.gtt_map_layers = [ts]
    get '/projects.xml?include=layers'
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert layer = projects.xpath('layers/layer').first
    assert layer.present?
    assert_equal 'Tile', layer['layer']
  end

  test 'GET /projects/1.xml with include=layers should return layers' do
    ts = RedmineGtt::Actions::CreateMapLayer.(layer: 'Tile', name: 'default', default: true).map_layer
    @project.gtt_map_layers = [ts]
    get '/projects/1.xml?include=layers'
    assert_response :success
    xml = xml_data
    assert project = xml.xpath('/project')
    assert layer = project.xpath('layers/layer').first
    assert layer.present?
    assert_equal 'Tile', layer['layer']
  end

  test 'GET /projects.xml with include=geometry,layers should return both geojson and layers' do
    ts = RedmineGtt::Actions::CreateMapLayer.(layer: 'Tile', name: 'default', default: true).map_layer
    @project.gtt_map_layers = [ts]
    @subproject1.gtt_map_layers = [ts]
    geo = {
      'type' => 'Feature',
      'geometry' => {
        'type' => 'Polygon',
        'coordinates' => [
          [[123.269691,9.305099,0.0], [123.279691,9.305099,0.0],[123.279691,9.405099,0.0],[123.269691,9.405099,0.0], [123.269691,9.305099,0.0]]
        ]
      }
    }
    geojson = geo.to_json

    @project.update_attribute :geojson, geojson
    @subproject1.update_attribute :geojson, geojson

    get '/projects.xml?include=geometry,layers'
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert json = projects.xpath('geojson').first.text
    assert json.present?
    assert_equal geo['geometry'], JSON.parse(json)['geometry'], json
    assert layer = projects.xpath('layers/layer').first
    assert layer.present?
    assert_equal 'Tile', layer['layer']
  end

  test 'GET /projects/1.xml with include=geometry,layers should return both geojson and layers' do
    ts = RedmineGtt::Actions::CreateMapLayer.(layer: 'Tile', name: 'default', default: true).map_layer
    @project.gtt_map_layers = [ts]
    geo = {
      'type' => 'Feature',
      'geometry' => {
        'type' => 'Polygon',
        'coordinates' => [
          [[123.269691,9.305099,0.0], [123.279691,9.305099,0.0],[123.279691,9.405099,0.0],[123.269691,9.405099,0.0], [123.269691,9.305099,0.0]]
        ]
      }
    }
    geojson = geo.to_json

    @project.update_attribute :geojson, geojson

    get '/projects/1.xml?include=geometry,layers'
    assert_response :success
    xml = xml_data
    assert project = xml.xpath('/project')
    assert json = project.xpath('geojson').first.text
    assert json.present?
    assert_equal geo['geometry'], JSON.parse(json)['geometry'], json
    assert layer = project.xpath('layers/layer').first
    assert layer.present?
    assert_equal 'Tile', layer['layer']
  end

  def xml_data
    Nokogiri::XML(@response.body)
  end
end
