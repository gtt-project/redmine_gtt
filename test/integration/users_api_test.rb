require_relative '../test_helper'

class UsersApiTest < Redmine::ApiTest::Base
  fixtures :users,
    :email_addresses,
    :members,
    :member_roles,
    :roles,
    :projects

  setup do
    @user = User.find_by_login 'jsmith' # id=2
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

    @user.update_attribute :geojson, geojson

    # xml format - index api
    get '/users.xml', :headers => credentials('admin')
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/users/user[id=2]/geojson').text
    assert json.present?
    assert_match(/123\.269691/, json)
    assert_equal geo['geometry'], JSON.parse(json)['geometry'], json
    # xml format - show api
    get '/users/2.xml', :headers => credentials('admin')
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/user/geojson').text
    assert json.present?
    assert_match(/123\.269691/, json)
    assert_equal geo['geometry'], JSON.parse(json)['geometry'], json

    # json format - index api
    get '/users.json', :headers => credentials('admin')
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['users'].detect{|i|i['id'] == @user.id}['geojson']
    assert_equal geo['geometry'], hsh['geometry']
    # json format - show api
    get '/users/2.json', :headers => credentials('admin')
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['user']['geojson']
    assert_equal geo['geometry'], hsh['geometry']
  end

  test 'should include empty geojson' do
    @user.update_attribute :geojson, nil

    # xml format - index api
    get '/users.xml', :headers => credentials('admin')
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/users/user[id=2]/geojson').text
    assert_equal "", json
    # xml format - show api
    get '/users/2.xml', :headers => credentials('admin')
    assert_response :success
    xml = xml_data
    assert json = xml.xpath('/user/geojson').text
    assert_equal "", json

    # json format - index api
    get '/users.json', :headers => credentials('admin')
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['users'].detect{|p|p['id'] == @user.id}['geojson']
    assert_nil hsh
    # json format - show api
    get '/users/2.json', :headers => credentials('admin')
    assert_response :success
    assert json = JSON.parse(@response.body)
    hsh = json['user']['geojson']
    assert_nil hsh
  end

  def xml_data
    Nokogiri::XML(@response.body)
  end
end
