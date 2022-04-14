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

    get '/projects.xml', params: {contains: 'POINT(123.271 9.35)'}
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 0, projects.size

    geo = {
      'type' => 'Feature',
      'geometry' => {
        'type' => 'Polygon',
        'coordinates' => [
          [[123.269691,9.305099], [123.279691,9.305099],[123.279691,9.405099],[123.269691,9.405099]]
        ]
      }
    }
    geojson = geo.to_json

    @project.update_attribute :geojson, geojson
    @subproject1.update_attribute :geojson, geojson
    assert @project.visible? && @subproject1.visible?

    get '/projects.xml', params: {contains: 'POINT(123.271 9.55)'}
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 0, projects.size

    get '/projects.xml', params: {contains: 'POINT(123.271 9.35)'}
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 2, projects.size, xml.to_s
    assert_equal ['ecookbook', 'subproject1'], projects.xpath('identifier').map {|n| n.text}
    assert_equal 0, projects.xpath('geojson').size, projects.to_s

  end

  test 'should include geojson on demand' do
    geo = {
      'type' => 'Feature',
      'geometry' => {
        'type' => 'Polygon',
        'coordinates' => [
          [[123.269691,9.305099], [123.279691,9.305099],[123.279691,9.405099],[123.269691,9.405099], [123.269691,9.305099]]
        ]
      }
    }
    geojson = geo.to_json

    @project.update_attribute :geojson, geojson
    @subproject1.update_attribute :geojson, geojson
    get '/projects.xml?include=geometry'
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert json = projects.xpath('geojson').first.text
    assert json.present?
    assert_match(/123\.269691/, json)
    assert_equal geo['geometry'], JSON.parse(json)['geometry'], json

    get '/projects.json?include=geometry'
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = JSON.parse json['projects'].detect{|p|p['id'] == @project.id}['geojson']
    assert_equal geo['geometry'], hsh['geometry']
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
          [[123.269691,9.305099], [123.279691,9.305099],[123.279691,9.405099],[123.269691,9.405099]]
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
      contains: 'POINT(123.271 9.35)'
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
      contains: 'POINT(123.271 9.35)'
    }
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 1, projects.size, xml.to_s
    assert_equal 'ecookbook', projects.xpath('identifier').text
    assert_equal 1, projects.xpath('geojson').size, projects.to_s
  end

  def xml_data
    Nokogiri::XML(@response.body)
  end
end


