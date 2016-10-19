Redmine::Plugin.register :redmine_gtt do
  name 'Redmine GTT plugin'
  author 'Georepublic'
  description 'This is a plugin for location-based task management in Redmine'
  version '0.0.1'
  # url 'http://example.com/path/to/plugin'
  author_url 'https://georepublic.info'

  # Home Page Redirector
  require_dependency 'home_page_redirector'

  Rails.configuration.to_prepare do
    # This tells the Redmine version's controller to include the module from the file above.
    WelcomeController.send(:include, HomePageRedirector::HomePageRedirector)
  end
end
