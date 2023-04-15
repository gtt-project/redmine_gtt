require_relative '../test_helper'

class IssuesApiTest < Redmine::ApiTest::Base
  fixtures :projects,
    :users,
    :roles,
    :members,
    :member_roles,
    :issues,
    :issue_statuses,
    :enabled_modules

  setup do
    @project = Project.find 'ecookbook'
    @project.enabled_modules.create name: 'gtt'
  end

  test 'should include geojson' do
    geo = {
      'type' => 'Feature',
      'geometry' => {
        'type' => 'Point',
        'coordinates' => [123.269691,9.305099,0.0]
      }
    }
    geojson = geo.to_json

    issue = @project.issues.find 1
    issue.update_attribute :geojson, geojson

    # xml format - index api
    get '/issues.xml'
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/issues/issue[id=1]/geojson').text
    assert json.present?
    assert_match(/123\.269691/, json)
    assert_equal geo['geometry'], JSON.parse(json)['geometry'], json
    # xml format - show api
    get '/issues/1.xml'
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/issue/geojson').text
    assert json.present?
    assert_match(/123\.269691/, json)
    assert_equal geo['geometry'], JSON.parse(json)['geometry'], json

    # json format - index api
    get '/issues.json'
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['issues'].detect{|i|i['id'] == issue.id}['geojson']
    assert_equal geo['geometry'], hsh['geometry']
    # json format - show api
    get '/issues/1.json'
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['issue']['geojson']
    assert_equal geo['geometry'], hsh['geometry']
  end

  test 'should include empty geojson' do
    issue = @project.issues.find 1
    issue.update_attribute :geojson, nil

    # xml format - index api
    get '/issues.xml'
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/issues/issue[id=1]/geojson').text
    assert_equal "", json
    # xml format - show api
    get '/issues/1.xml'
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/issue/geojson').text
    assert_equal "", json

    # json format - index api
    get '/issues.json'
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['issues'].detect{|p|p['id'] == issue.id}['geojson']
    assert_nil hsh
    # json format - show api
    get '/issues/1.json'
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['issue']['geojson']
    assert_nil hsh
  end

  def xml_data
    Nokogiri::XML(@response.body)
  end
end
