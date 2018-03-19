require_relative '../test_helper'

class ProjectsApiTest < Redmine::IntegrationTest
  fixtures :users, :email_addresses, :roles, :projects, :members, :member_roles

  setup do
    User.current = nil
    @project = Project.find 'ecookbook'
    @project.enabled_modules.create name: 'gtt'
  end

  test 'should should filter projects by geometry' do
    get '/projects.xml'
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert projects.any?
    assert_equal Project.visible.count, projects.size

    get '/projects.xml', contains: 'POINT(123.271 9.35)'
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 0, projects.size

    @project.update_attribute :geojson, {
      'type' => 'Feature',
      'geometry' => {
        'type' => 'Polygon',
        'coordinates' => [
          [[123.269691,9.305099], [123.279691,9.305099],[123.279691,9.405099],[123.269691,9.405099]]
        ]
      }
    }.to_json

    assert @project.visible?

    get '/projects.xml', contains: 'POINT(123.271 9.55)'
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 0, projects.size

    get '/projects.xml', contains: 'POINT(123.271 9.35)'
    assert_response :success
    xml = xml_data
    assert projects = xml.xpath('/projects/project')
    assert_equal 1, projects.size, xml.to_s
    assert_equal 'ecookbook', projects.xpath('identifier').text

  end

  def xml_data
    Nokogiri::XML(@response.body)
  end
end


