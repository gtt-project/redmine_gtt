# Source: https://github.com/jmlagace/redmine_home_page_redirector
module HomePageRedirector
  module HomePageRedirector
    def self.included(base)
      base.class_eval do
        # Insert overrides here, for example:
        def index_with_redirector
          unless User.current.anonymous?
            redirect_to my_page_path
          else
            index_without_redirector
          end
        end
        alias_method_chain :index, :redirector
      end
    end
  end
end
