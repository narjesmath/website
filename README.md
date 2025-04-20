# Personal Website

[Live Site →](https://narjesmathlouthi.com)

## Overview
This repository contains the source for my personal website built with R Markdown and the Distill framework, hosted on GitHub Pages. The site features:

- **Home** Bio page 
- **Teaching** page detailing courses supported  
- **Projects** page showcasing recent work  
- **Research** page summarizing interests  
- **CV** page with a downloadable resume  

## Repository Structure







## Prerequisites
- **R** (version ≥ 4.0)  
- **RStudio** or any R IDE  
- R packages:
  ```r
  install.packages(c("rmarkdown", "distill"))
  ```
  
  ```r
  remotes::install_github("rstudio/distill")
  ```
  
- **Git** (for version control)
- **GitHub** account (for hosting the website)
- **Quarto** (for advanced features)
 

  
## Building the Site Locally

1.	Render the site (generates HTML in docs/):

  ```r
  rmarkdown::render_site()
  ```
	
2.	Preview (in RStudio): Build → Preview Site
Or from the console:
  ```r
  rmarkdown::run("index.Rmd", shiny_args = list(port = 4321))
  ```



## License

Distributed under the MIT License.

## Contact

- Email: nmathlouthi@ucsb.edu
- GitHub: @narjesmath

  
  
